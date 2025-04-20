const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middlewares/auth');
const siteController = require('../controllers/site_controller');

/**
 * @route GET /api/site/maintenance
 * @desc Obtener estado actual del modo mantenimiento
 * @access Público
 */
router.get('/maintenance', siteController.getMaintenanceStatus);

/**
 * @route POST /api/site/maintenance
 * @desc Activar/desactivar modo mantenimiento
 * @access Privado (solo admin)
 */
router.post('/maintenance', auth, checkRole('admin'), siteController.toggleMaintenanceMode);

module.exports = router; 