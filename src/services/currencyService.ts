import ExchangeRate from '../models/model_exchangeRate';
import ExchangeRateConfig from '../models/model_exchangeRateConfig';
import logger from '../configs/logger';
import axios from 'axios';

export type SupportedBaseCurrency = 'USD' | 'EUR';

// Mapa: método de pago → moneda que usa el cliente
const PAYMENT_METHOD_CURRENCY_MAP: Record<string, 'USD' | 'EUR' | 'VES' | 'USDT'> = {
  transferencia_ves: 'VES',
  pago_movil: 'VES',
  punto_venta: 'VES',
  efectivo_bolivares: 'VES',
  efectivo_usd: 'USD',
  efectivo_eur: 'EUR',
  usdt: 'USDT',
  tarjeta: 'USD',              // Se asume USD por defecto para tarjeta
  transferencia_internacional: 'USD',
  // aliases legacy
  transferencia: 'VES',
  efectivo_divisa_USD: 'USD',
  efectivo_divisa_EUR: 'EUR',
};

/**
 * Obtiene la moneda del cliente según el método de pago seleccionado.
 */
const getPaymentCurrency = (paymentMethod: string): 'USD' | 'EUR' | 'VES' | 'USDT' => {
  return PAYMENT_METHOD_CURRENCY_MAP[paymentMethod] || 'USD';
};

/**
 * Obtiene la configuración activa del sistema de tasas de cambio.
 * Si no existe, la crea con modo 'disabled' por defecto.
 */
const getConfig = async (): Promise<InstanceType<typeof ExchangeRateConfig>> => {
  let config = await ExchangeRateConfig.findOne({ where: { id: 1 } });
  if (!config) {
    config = await ExchangeRateConfig.create({
      id: 1,
      mode: 'disabled',
      auto_api_url: 'https://api.exchangerate-api.com/v4/latest/USD',
      auto_update_hour: 8,
    });
  }
  return config;
};

/**
 * Obtiene la tasa activa para un par de monedas (ej: USD → VES).
 * Retorna null si no hay tasa activa o el modo está desactivado.
 */
const getActiveRate = async (from: SupportedBaseCurrency, to: 'VES' = 'VES'): Promise<{ rate: number; source: string } | null> => {
  try {
    const config = await getConfig();
    if (config.mode === 'disabled') return null;

    const rateRecord = await ExchangeRate.findOne({
      where: { currency_from: from, currency_to: to, is_active: true },
      order: [['createdAt', 'DESC']],
    });

    if (!rateRecord) return null;
    return { rate: parseFloat(rateRecord.rate as unknown as string), source: rateRecord.source };
  } catch (err: any) {
    logger.error('currencyService: error obteniendo tasa activa', { error: err.message, from, to });
    return null;
  }
};

/**
 * Convierte un monto desde USD o EUR a VES usando la tasa activa.
 * Retorna null si el sistema de tasas está desactivado.
 */
const convertToVES = async (
  amount: number,
  from: SupportedBaseCurrency
): Promise<{ amount_ves: number; rate: number; source: string } | null> => {
  const rateData = await getActiveRate(from);
  if (!rateData) return null;
  return {
    amount_ves: parseFloat((amount * rateData.rate).toFixed(2)),
    rate: rateData.rate,
    source: rateData.source,
  };
};

/**
 * Enriquece un producto con precios calculados en VES (si la tasa está activa).
 * El precio original en USD/EUR siempre está disponible.
 */
const getPricesWithConversion = async (product: {
  price: number | string;
  currency: SupportedBaseCurrency;
}): Promise<{
  price: number;
  currency: SupportedBaseCurrency;
  price_ves?: number;
  exchange_rate_ves?: number;
  exchange_rate_source?: string;
}> => {
  const basePrice = parseFloat(product.price as string);
  const result: ReturnType<typeof getPricesWithConversion> extends Promise<infer T> ? T : never = {
    price: basePrice,
    currency: product.currency,
  };

  const conversion = await convertToVES(basePrice, product.currency);
  if (conversion) {
    result.price_ves = conversion.amount_ves;
    result.exchange_rate_ves = conversion.rate;
    result.exchange_rate_source = conversion.source;
  }

  return result;
};

/**
 * Obtiene las tasas activas para todas las monedas soportadas.
 * Formato de respuesta pensado para el endpoint público GET /api/exchange-rates
 */
const getAllActiveRates = async (): Promise<{
  mode: string;
  rates: Array<{ from: string; to: string; rate: number; source: string; updated_at: Date }>;
}> => {
  const config = await getConfig();
  if (config.mode === 'disabled') {
    return { mode: 'disabled', rates: [] };
  }

  const rates = await ExchangeRate.findAll({
    where: { is_active: true },
    order: [['createdAt', 'DESC']],
  });

  return {
    mode: config.mode,
    rates: rates.map((r) => ({
      from: r.currency_from,
      to: r.currency_to,
      rate: parseFloat(r.rate as unknown as string),
      source: r.source,
      updated_at: r.updatedAt as Date,
    })),
  };
};

/**
 * Obtiene la tasa desde una API externa y la guarda en BD.
 * Desactiva la tasa anterior del mismo par.
 * Solo se ejecuta si el modo es 'auto'.
 */
const fetchRateFromAPI = async (): Promise<void> => {
  const config = await getConfig();
  if (config.mode !== 'auto') {
    logger.info('currencyService: fetchRateFromAPI ignorado, modo no es auto', { mode: config.mode });
    return;
  }

  try {
    const apiUrl = config.auto_api_url || 'https://api.exchangerate-api.com/v4/latest/USD';
    logger.info('currencyService: obteniendo tasa desde API', { url: apiUrl });

    const response = await axios.get(apiUrl, { timeout: 10000 });
    const data = response.data;

    // ExchangeRate-API formato: { rates: { VES: 36.50, EUR: 0.92 } }
    // Necesitamos USD→VES y EUR→VES
    const usdToVes = data?.rates?.VES;
    const eurToUsd = data?.rates?.EUR; // 1 USD = 0.92 EUR → 1 EUR = 1/0.92 USD → EUR a VES = usdToVes / eurToUsd

    if (!usdToVes) {
      logger.warn('currencyService: API no devolvió tasa VES', { data });
      return;
    }

    // Guardar USD→VES
    await _saveRate('USD', 'VES', usdToVes, 'api');

    // Calcular y guardar EUR→VES si tenemos la tasa EUR/USD
    if (eurToUsd && eurToUsd > 0) {
      const eurToVes = usdToVes / eurToUsd;
      await _saveRate('EUR', 'VES', eurToVes, 'api');
    }

    // Actualizar timestamp de última actualización
    await config.update({ last_auto_update: new Date() });

    logger.info('currencyService: tasa actualizada desde API', {
      usd_to_ves: usdToVes,
      eur_to_ves: eurToUsd ? usdToVes / eurToUsd : 'no disponible',
    });
  } catch (err: any) {
    logger.error('currencyService: error al obtener tasa desde API', { error: err.message });
  }
};

/**
 * Guarda una nueva tasa activa y desactiva la anterior del mismo par.
 * Función interna — usar setManualRate o fetchRateFromAPI para acceso externo.
 */
const _saveRate = async (
  from: SupportedBaseCurrency,
  to: 'VES',
  rate: number,
  source: 'manual' | 'api',
  set_by?: number
): Promise<InstanceType<typeof ExchangeRate>> => {
  // Desactivar tasa anterior del mismo par
  await ExchangeRate.update(
    { is_active: false },
    { where: { currency_from: from, currency_to: to, is_active: true } }
  );

  // Crear nueva tasa activa
  return ExchangeRate.create({
    currency_from: from,
    currency_to: to,
    rate,
    source,
    is_active: true,
    set_by: set_by || null,
    valid_from: new Date(),
  });
};

/**
 * Fija una tasa manual y cambia el modo a 'manual' si era 'disabled'.
 * Si el modo era 'auto', lo mantiene pero sobreescribe la tasa activa.
 */
const setManualRate = async (
  from: SupportedBaseCurrency,
  rate: number,
  adminUserId: number
): Promise<InstanceType<typeof ExchangeRate>> => {
  const config = await getConfig();

  // Si estaba disabled, cambiar a manual automáticamente
  if (config.mode === 'disabled') {
    await config.update({ mode: 'manual' });
  }

  return _saveRate(from, 'VES', rate, 'manual', adminUserId);
};

const currencyService = {
  getPaymentCurrency,
  getConfig,
  getActiveRate,
  convertToVES,
  getPricesWithConversion,
  getAllActiveRates,
  fetchRateFromAPI,
  setManualRate,
  _saveRate,
};

export default currencyService;
