import express from 'express';
const router = express.Router();
import { auth, checkRole } from '../middlewares/auth';
import * as shippingMethodController from '../controllers/shippingMethod_controller';

/**
 * @route GET /api/shipping-methods
 * @desc Obtener todos los métodos de envío
 * @access Público
 */
router.get('/', shippingMethodController.getAllShippingMethods);

/**
 * @route GET /api/shipping-methods/:id
 * @desc Obtener método de envío por ID
 * @access Público
 */
router.get('/:id', shippingMethodController.getShippingMethodById);

/**
 * @route POST /api/shipping-methods
 * @desc Crear nuevo método de envío
 * @access Privado (solo admin)
 */
router.post('/', auth, checkRole(['admin']), shippingMethodController.createShippingMethod);

/**
 * @route PUT /api/shipping-methods/:id
 * @desc Actualizar método de envío
 * @access Privado (solo admin)
 */
router.put('/:id', auth, checkRole(['admin']), shippingMethodController.updateShippingMethod);

/**
 * @route DELETE /api/shipping-methods/:id
 * @desc Eliminar método de envío
 * @access Privado (solo admin)
 */
router.delete('/:id', auth, checkRole(['admin']), shippingMethodController.deleteShippingMethod);

export default router;
