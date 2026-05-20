import express from 'express';
const router = express.Router();
import { auth, checkRole } from '../middlewares/auth';
import * as deliveryZoneController from '../controllers/deliveryZone_controller';

/**
 * @route GET /api/delivery-zones
 * @desc Obtener todas las zonas de delivery
 * @access Público
 */
router.get('/', deliveryZoneController.getAllDeliveryZones);

/**
 * @route GET /api/delivery-zones/:id
 * @desc Obtener zona de delivery por ID
 * @access Público
 */
router.get('/:id', deliveryZoneController.getDeliveryZoneById);

/**
 * @route POST /api/delivery-zones
 * @desc Crear nueva zona de delivery
 * @access Privado (solo admin)
 */
router.post('/', auth, checkRole(['admin']), deliveryZoneController.createDeliveryZone);

/**
 * @route PUT /api/delivery-zones/:id
 * @desc Actualizar zona de delivery
 * @access Privado (solo admin)
 */
router.put('/:id', auth, checkRole(['admin']), deliveryZoneController.updateDeliveryZone);

/**
 * @route DELETE /api/delivery-zones/:id
 * @desc Eliminar zona de delivery
 * @access Privado (solo admin)
 */
router.delete('/:id', auth, checkRole(['admin']), deliveryZoneController.deleteDeliveryZone);

export default router;
