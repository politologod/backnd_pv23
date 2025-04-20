/**
 * Rutas para monitoreo de salud del servicio
 */

const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthcheck');

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Obtener estado completo del servicio
 *     description: Devuelve información detallada sobre el estado del servicio y sus dependencias
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Servicio funcionando correctamente o con degradación
 *       500:
 *         description: Servicio en estado crítico
 */
router.get('/', healthController.getStatus);

/**
 * @swagger
 * /api/health/liveness:
 *   get:
 *     summary: Verificación rápida del servicio
 *     description: Comprueba si el servicio está activo y respondiendo
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Servicio funcionando
 */
router.get('/liveness', healthController.getLiveness);

/**
 * @swagger
 * /api/health/readiness:
 *   get:
 *     summary: Verificación de disponibilidad
 *     description: Comprueba si el servicio y sus dependencias están listos para recibir tráfico
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Servicio listo
 *       503:
 *         description: Servicio no disponible
 */
router.get('/readiness', healthController.getReadiness);

/**
 * @swagger
 * /api/health/metrics:
 *   get:
 *     summary: Métricas del servicio
 *     description: Devuelve métricas operacionales para monitoreo
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Métricas obtenidas
 */
router.get('/metrics', healthController.getMetrics);

module.exports = router; 