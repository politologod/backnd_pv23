import express from 'express';
const router = express.Router();
import {  auth, checkRole  } from '../middlewares/auth';
import * as siteController from '../controllers/site_controller';

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

/**
 * @route GET /api/site/config
 * @desc Obtener configuración completa de la tienda
 * @access Público
 */
router.get('/config', siteController.getStoreConfig);

/**
 * @route PUT /api/site/config
 * @desc Actualizar configuración de la tienda
 * @access Privado (solo admin)
 */
router.put('/config', auth, checkRole('admin'), siteController.updateStoreConfig);

/**
 * @route GET /api/site/schedule
 * @desc Obtener horario de la tienda
 * @access Público
 */
router.get('/schedule', siteController.getSchedule);

/**
 * @route PUT /api/site/schedule
 * @desc Actualizar horario de la tienda
 * @access Privado (solo admin)
 */
router.put('/schedule', auth, checkRole('admin'), siteController.updateSchedule);

export default router;