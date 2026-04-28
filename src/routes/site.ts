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

export default router; 