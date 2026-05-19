import express from 'express';
const router = express.Router();
import { auth, checkRole } from '../middlewares/auth';
import * as exchangeRateController from '../controllers/exchangeRate_controller';

/**
 * @swagger
 * tags:
 *   name: Exchange Rates
 *   description: Gestión de tasas de cambio (VES/USD y VES/EUR)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ExchangeRate:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID del registro de tasa
 *         currency_from:
 *           type: string
 *           enum: [USD, EUR]
 *           description: Moneda base
 *         currency_to:
 *           type: string
 *           enum: [VES]
 *           description: Moneda destino (siempre VES)
 *         rate:
 *           type: number
 *           format: float
 *           description: Tasa de cambio (Bs por 1 USD o 1 EUR)
 *         source:
 *           type: string
 *           enum: [manual, auto]
 *           description: Origen de la tasa
 *         createdAt:
 *           type: string
 *           format: date-time
 *     ExchangeRateConfig:
 *       type: object
 *       properties:
 *         mode:
 *           type: string
 *           enum: [auto, manual, disabled]
 *           description: Modo de operación del sistema de tasas
 *         auto_api_url:
 *           type: string
 *           description: URL de la API externa para obtener tasas automáticamente
 *         auto_update_hour:
 *           type: integer
 *           minimum: 0
 *           maximum: 23
 *           description: Hora del día (0-23) en que se actualiza la tasa automáticamente
 */

/**
 * @swagger
 * /api/exchange-rates:
 *   get:
 *     summary: Obtener tasas de cambio activas
 *     description: >
 *       Devuelve las tasas VES/USD y VES/EUR vigentes y el modo actual del sistema.
 *       Este endpoint es público y lo usa el frontend para mostrar precios en bolívares.
 *     tags: [Exchange Rates]
 *     responses:
 *       200:
 *         description: Tasas activas y modo del sistema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     mode:
 *                       type: string
 *                       enum: [auto, manual, disabled]
 *                     rates:
 *                       type: object
 *                       properties:
 *                         USD:
 *                           type: number
 *                           description: Bolívares por 1 USD
 *                           example: 36.50
 *                         EUR:
 *                           type: number
 *                           description: Bolívares por 1 EUR
 *                           example: 39.80
 *       503:
 *         description: Sistema de tasas deshabilitado
 */
router.get('/', exchangeRateController.getActiveRates);

/**
 * @swagger
 * /api/exchange-rates/config:
 *   get:
 *     summary: Ver configuración del sistema de tasas (Admin)
 *     description: Devuelve el modo actual, URL de la API externa y hora de actualización automática.
 *     tags: [Exchange Rates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuración actual del sistema de tasas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ExchangeRateConfig'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No tiene permisos de administrador
 */
router.get('/config', auth, checkRole('admin'), exchangeRateController.getConfig);

/**
 * @swagger
 * /api/exchange-rates/config:
 *   put:
 *     summary: Cambiar configuración del sistema de tasas (Admin)
 *     description: >
 *       Permite cambiar el modo del sistema entre automático, manual o deshabilitado.
 *       En modo `auto`, las tasas se obtienen diariamente desde una API externa.
 *       En modo `manual`, el administrador fija las tasas vía `/api/exchange-rates/manual`.
 *       En modo `disabled`, los precios en VES no se mostrarán.
 *     tags: [Exchange Rates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mode
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [auto, manual, disabled]
 *                 description: Modo de operación del sistema de tasas
 *               auto_api_url:
 *                 type: string
 *                 description: URL de la API externa (solo requerida si mode=auto)
 *                 example: "https://api.bcv.org.ve/rates"
 *               auto_update_hour:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 23
 *                 description: Hora del día en que se actualiza la tasa (solo si mode=auto)
 *                 example: 9
 *     responses:
 *       200:
 *         description: Configuración actualizada correctamente
 *       400:
 *         description: Datos inválidos (modo no reconocido o URL faltante en modo auto)
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No tiene permisos de administrador
 */
router.put('/config', auth, checkRole('admin'), exchangeRateController.updateConfig);

/**
 * @swagger
 * /api/exchange-rates/manual:
 *   post:
 *     summary: Fijar tasa de cambio manualmente (Admin)
 *     description: >
 *       Permite al administrador establecer una tasa de cambio específica para USD→VES o EUR→VES.
 *       Solo funciona cuando el sistema está en modo `manual`.
 *     tags: [Exchange Rates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currency_from
 *               - rate
 *             properties:
 *               currency_from:
 *                 type: string
 *                 enum: [USD, EUR]
 *                 description: Moneda base de la tasa a fijar
 *               rate:
 *                 type: number
 *                 format: float
 *                 description: Tasa de cambio en bolívares (Bs por 1 unidad de la moneda base)
 *                 example: 36.50
 *     responses:
 *       200:
 *         description: Tasa fijada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ExchangeRate'
 *       400:
 *         description: Datos inválidos o sistema no está en modo manual
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No tiene permisos de administrador
 */
router.post('/manual', auth, checkRole('admin'), exchangeRateController.setManualRate);

/**
 * @swagger
 * /api/exchange-rates/refresh:
 *   post:
 *     summary: Forzar actualización de tasas desde la API externa (Admin)
 *     description: >
 *       Dispara una actualización inmediata de las tasas de cambio consultando la API externa configurada.
 *       Solo funciona cuando el sistema está en modo `auto`.
 *     tags: [Exchange Rates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tasas actualizadas correctamente desde la API externa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     USD:
 *                       type: number
 *                       example: 36.50
 *                     EUR:
 *                       type: number
 *                       example: 39.80
 *       400:
 *         description: El sistema no está en modo automático
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No tiene permisos de administrador
 *       502:
 *         description: Error al conectar con la API externa de tasas
 */
router.post('/refresh', auth, checkRole('admin'), exchangeRateController.forceRefreshFromAPI);

/**
 * @swagger
 * /api/exchange-rates/history:
 *   get:
 *     summary: Historial de tasas de cambio registradas (Admin)
 *     description: Devuelve el historial de tasas VES/USD o VES/EUR ordenadas de más reciente a más antigua.
 *     tags: [Exchange Rates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: currency_from
 *         schema:
 *           type: string
 *           enum: [USD, EUR]
 *         description: Filtrar historial por moneda base (USD o EUR)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Número máximo de registros a devolver
 *     responses:
 *       200:
 *         description: Historial de tasas de cambio
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ExchangeRate'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No tiene permisos de administrador
 */
router.get('/history', auth, checkRole('admin'), exchangeRateController.getRateHistory);

export default router;
