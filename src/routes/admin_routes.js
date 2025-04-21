const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middlewares/auth');
const adminController = require('../controllers/admin_controller');

/**
 * @route GET /api/admin/stats
 * @desc Obtener estadísticas generales
 * @access Privado (solo admin)
 */
router.get('/stats', auth, checkRole(["admin"]), adminController.getGeneralStats);

/**
 * @route GET /api/admin/stats/category
 * @desc Obtener estadísticas de ventas por categoría
 * @access Privado (solo admin)
 */
router.get('/stats/category', auth, checkRole(["admin"]), adminController.getSalesByCategory);

/**
 * @route GET /api/admin/stats/orders
 * @desc Obtener estadísticas de órdenes por mes
 * @access Privado (solo admin)
 */
router.get('/stats/orders', auth, checkRole(["admin"]), adminController.getOrdersByMonth);

/**
 * @route GET /api/admin/stats/customers
 * @desc Obtener estadísticas de clientes por mes
 * @access Privado (solo admin)
 */
router.get('/stats/customers', auth, checkRole(["admin"]), adminController.getCustomersByMonth);

/**
 * @route GET /api/admin/stats/sales
 * @desc Obtener estadísticas de ventas por mes
 * @access Privado (solo admin)
 */
router.get('/stats/sales', auth, checkRole(["admin"]), adminController.getSalesByMonth);

/**
 * @route GET /api/admin/dashboard
 * @desc Obtener datos para el dashboard de administración
 * @access Privado (solo admin)
 */
router.get('/stats/dashboard', auth, checkRole(["admin"]), adminController.getDashboardStats);

/**
 * @route GET /api/admin/maintenance
 * @desc Obtener estado actual del modo mantenimiento
 * @access Privado (solo admin)
 */
router.get('/maintenance', auth, checkRole(["admin"]), adminController.getMaintenanceMode);

/**
 * @route POST /api/admin/maintenance
 * @desc Activar/desactivar modo mantenimiento
 * @access Privado (solo admin)
 */
router.post('/maintenance', auth, checkRole(["admin"]), adminController.setMaintenanceMode);

module.exports = router; 