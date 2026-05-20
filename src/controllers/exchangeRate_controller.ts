// @ts-nocheck
import { Request, Response } from 'express';
import ExchangeRate from '../models/model_exchangeRate';
import ExchangeRateConfig from '../models/model_exchangeRateConfig';
import currencyService, { SupportedBaseCurrency } from '../services/currencyService';
import logger from '../configs/logger';
import User from '../models/model_user';

// ─────────────────────────────────────────────
// GET /api/exchange-rates  (público)
// Devuelve las tasas activas y el modo configurado.
// El frontend usa esto para mostrar precios en VES.
// ─────────────────────────────────────────────
const getActiveRates = async (req: Request, res: Response) => {
  try {
    const result = await currencyService.getAllActiveRates();
    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    logger.error('exchangeRate: error al obtener tasas activas', { error: err.message });
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ─────────────────────────────────────────────
// GET /api/exchange-rates/config  (admin)
// Ver la configuración actual del sistema de tasas.
// ─────────────────────────────────────────────
const getConfig = async (req: Request, res: Response) => {
  try {
    const config = await currencyService.getConfig();
    return res.status(200).json({ success: true, data: config });
  } catch (err: any) {
    logger.error('exchangeRate: error al obtener configuración', { error: err.message });
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ─────────────────────────────────────────────
// PUT /api/exchange-rates/config  (admin)
// Cambiar el modo del sistema: auto | manual | disabled
// También permite cambiar la URL de la API y la hora de actualización.
// ─────────────────────────────────────────────
const updateConfig = async (req: Request, res: Response) => {
  try {
    const { mode, auto_api_url, auto_update_hour } = req.body;

    const validModes = ['auto', 'manual', 'disabled'];
    if (mode && !validModes.includes(mode)) {
      return res.status(400).json({
        success: false,
        message: `Modo inválido. Valores válidos: ${validModes.join(', ')}`,
      });
    }

    if (auto_update_hour !== undefined && (auto_update_hour < 0 || auto_update_hour > 23)) {
      return res.status(400).json({
        success: false,
        message: 'auto_update_hour debe ser un número entre 0 y 23',
      });
    }

    const config = await currencyService.getConfig();
    const updates: any = {};
    if (mode) updates.mode = mode;
    if (auto_api_url) updates.auto_api_url = auto_api_url;
    if (auto_update_hour !== undefined) updates.auto_update_hour = auto_update_hour;

    await config.update(updates);

    logger.info('exchangeRate: configuración actualizada', {
      updatedBy: req.user?.id,
      changes: updates,
    });

    return res.status(200).json({
      success: true,
      message: 'Configuración actualizada correctamente',
      data: config,
    });
  } catch (err: any) {
    logger.error('exchangeRate: error al actualizar configuración', { error: err.message });
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ─────────────────────────────────────────────
// POST /api/exchange-rates/manual  (admin)
// Fijar manualmente la tasa de cambio para USD→VES o EUR→VES.
// Body: { currency_from: 'USD'|'EUR', rate: number }
// ─────────────────────────────────────────────
const setManualRate = async (req: Request, res: Response) => {
  try {
    const { currency_from, rate } = req.body;

    if (!currency_from || !['USD', 'EUR'].includes(currency_from)) {
      return res.status(400).json({
        success: false,
        message: 'currency_from debe ser "USD" o "EUR"',
      });
    }

    const parsedRate = parseFloat(rate);
    if (isNaN(parsedRate) || parsedRate <= 0) {
      return res.status(400).json({
        success: false,
        message: 'rate debe ser un número positivo. Ejemplo: 36.50 para 1 USD = 36.50 VES',
      });
    }

    const newRate = await currencyService.setManualRate(
      currency_from as SupportedBaseCurrency,
      parsedRate,
      req.user!.id
    );

    logger.info('exchangeRate: tasa manual establecida', {
      currency_from,
      rate: parsedRate,
      set_by: req.user!.id,
    });

    return res.status(201).json({
      success: true,
      message: `Tasa ${currency_from}→VES actualizada a ${parsedRate}`,
      data: newRate,
    });
  } catch (err: any) {
    logger.error('exchangeRate: error al establecer tasa manual', { error: err.message });
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ─────────────────────────────────────────────
// POST /api/exchange-rates/refresh  (admin)
// Forzar actualización de tasa desde la API externa ahora mismo.
// Solo funciona si el modo es 'auto'.
// ─────────────────────────────────────────────
const forceRefreshFromAPI = async (req: Request, res: Response) => {
  try {
    const config = await currencyService.getConfig();

    if (config.mode !== 'auto') {
      return res.status(400).json({
        success: false,
        message: `No se puede refrescar: el modo actual es "${config.mode}". Cámbialo a "auto" primero.`,
      });
    }

    await currencyService.fetchRateFromAPI();

    // Obtener las tasas actualizadas para devolverlas
    const updatedRates = await currencyService.getAllActiveRates();

    return res.status(200).json({
      success: true,
      message: 'Tasas actualizadas desde la API correctamente',
      data: updatedRates,
    });
  } catch (err: any) {
    logger.error('exchangeRate: error al forzar actualización desde API', { error: err.message });
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ─────────────────────────────────────────────
// GET /api/exchange-rates/history  (admin)
// Historial de tasas de cambio registradas.
// Query params: ?currency_from=USD&limit=20
// ─────────────────────────────────────────────
const getRateHistory = async (req: Request, res: Response) => {
  try {
    const { currency_from, limit = '20' } = req.query;

    const where: any = {};
    if (currency_from && ['USD', 'EUR'].includes(currency_from as string)) {
      where.currency_from = currency_from;
    }

    const history = await ExchangeRate.findAll({
      where,
      include: [
        {
          model: User,
          as: 'setByUser',
          attributes: ['id_autoincrement', 'name', 'email'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Math.min(parseInt(limit as string) || 20, 100),
    });

    return res.status(200).json({ success: true, data: history });
  } catch (err: any) {
    logger.error('exchangeRate: error al obtener historial', { error: err.message });
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

export {
  getActiveRates,
  getConfig,
  updateConfig,
  setManualRate,
  forceRefreshFromAPI,
  getRateHistory,
};
