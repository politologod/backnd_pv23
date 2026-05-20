import express from 'express';
const router = express.Router();
import {  auth, checkRole  } from '../middlewares/auth';
import * as adminController from '../controllers/admin_controller';

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Obtener estadísticas generales
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas generales del sistema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                 totalProducts:
 *                   type: integer
 *                 totalOrders:
 *                   type: integer
 *                 totalRevenue:
 *                   type: number
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Rol insuficiente
 */
router.get('/stats', auth, checkRole(["admin"]), adminController.getGeneralStats);

/**
 * @swagger
 * /api/admin/stats/category:
 *   get:
 *     summary: Obtener estadísticas de ventas por categoría
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ventas agrupadas por categoría
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Rol insuficiente
 */
router.get('/stats/category', auth, checkRole(["admin"]), adminController.getSalesByCategory);

/**
 * @swagger
 * /api/admin/stats/orders:
 *   get:
 *     summary: Obtener estadísticas de órdenes por mes
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Órdenes agrupadas por mes
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Rol insuficiente
 */
router.get('/stats/orders', auth, checkRole(["admin"]), adminController.getOrdersByMonth);

/**
 * @swagger
 * /api/admin/stats/customers:
 *   get:
 *     summary: Obtener estadísticas de clientes por mes
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Clientes nuevos agrupados por mes
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Rol insuficiente
 */
router.get('/stats/customers', auth, checkRole(["admin"]), adminController.getCustomersByMonth);

/**
 * @swagger
 * /api/admin/stats/sales:
 *   get:
 *     summary: Obtener estadísticas de ventas por mes
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ventas agrupadas por mes
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Rol insuficiente
 */
router.get('/stats/sales', auth, checkRole(["admin"]), adminController.getSalesByMonth);

/**
 * @swagger
 * /api/admin/stats/dashboard:
 *   get:
 *     summary: Obtener datos completos del dashboard de administración
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos consolidados del dashboard
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Rol insuficiente
 */
router.get('/stats/dashboard', auth, checkRole(["admin"]), adminController.getDashboardStats);

/**
 * @swagger
 * /api/admin/maintenance:
 *   get:
 *     summary: Obtener estado del modo mantenimiento
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado actual del modo mantenimiento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 maintenanceMode:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Rol insuficiente
 */
router.get('/maintenance', auth, checkRole(["admin"]), adminController.getMaintenanceMode);

/**
 * @swagger
 * /api/admin/maintenance:
 *   post:
 *     summary: Activar o desactivar modo mantenimiento
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enabled
 *             properties:
 *               enabled:
 *                 type: boolean
 *               message:
 *                 type: string
 *                 description: Mensaje a mostrar durante el mantenimiento
 *     responses:
 *       200:
 *         description: Modo mantenimiento actualizado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Rol insuficiente
 */
router.post('/maintenance', auth, checkRole(["admin"]), adminController.setMaintenanceMode);

export default router;