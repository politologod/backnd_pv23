import express from 'express';
const router = express.Router();
import { auth, checkRole } from '../middlewares/auth';
import * as exchangeRateController from '../controllers/exchangeRate_controller';

/**
 * @route   GET /api/exchange-rates
 * @desc    Obtener tasas de cambio activas y modo del sistema
 * @access  Público (lo usa el frontend para mostrar precios en VES)
 */
router.get('/', exchangeRateController.getActiveRates);

/**
 * @route   GET /api/exchange-rates/config
 * @desc    Ver configuración del sistema de tasas (modo, URL API, hora de actualización)
 * @access  Privado (admin)
 */
router.get('/config', auth, checkRole('admin'), exchangeRateController.getConfig);

/**
 * @route   PUT /api/exchange-rates/config
 * @desc    Cambiar modo del sistema: auto | manual | disabled
 * @access  Privado (admin)
 * @body    { mode: 'auto'|'manual'|'disabled', auto_api_url?: string, auto_update_hour?: number }
 */
router.put('/config', auth, checkRole('admin'), exchangeRateController.updateConfig);

/**
 * @route   POST /api/exchange-rates/manual
 * @desc    Fijar tasa de cambio manualmente (USD→VES o EUR→VES)
 * @access  Privado (admin)
 * @body    { currency_from: 'USD'|'EUR', rate: number }
 */
router.post('/manual', auth, checkRole('admin'), exchangeRateController.setManualRate);

/**
 * @route   POST /api/exchange-rates/refresh
 * @desc    Forzar actualización de tasas desde la API externa (solo modo auto)
 * @access  Privado (admin)
 */
router.post('/refresh', auth, checkRole('admin'), exchangeRateController.forceRefreshFromAPI);

/**
 * @route   GET /api/exchange-rates/history
 * @desc    Historial de tasas registradas
 * @access  Privado (admin)
 * @query   currency_from=USD|EUR  limit=20
 */
router.get('/history', auth, checkRole('admin'), exchangeRateController.getRateHistory);

export default router;
