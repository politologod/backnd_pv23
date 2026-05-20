import express from 'express';
const router = express.Router();
import { auth, checkRole } from '../middlewares/auth';
import * as paymentMethodController from '../controllers/paymentMethod_controller';

/**
 * @route GET /api/payment-methods
 * @desc Obtener todos los métodos de pago
 * @access Público (para que el storefront pueda listar métodos activos)
 */
router.get('/', paymentMethodController.getAllPaymentMethods);

/**
 * @route GET /api/payment-methods/:id
 * @desc Obtener método de pago por ID
 * @access Público
 */
router.get('/:id', paymentMethodController.getPaymentMethodById);

/**
 * @route POST /api/payment-methods
 * @desc Crear nuevo método de pago
 * @access Privado (solo admin)
 */
router.post('/', auth, checkRole(['admin']), paymentMethodController.createPaymentMethod);

/**
 * @route PUT /api/payment-methods/:id
 * @desc Actualizar método de pago (toggle enabled, cambiar label, etc.)
 * @access Privado (solo admin)
 */
router.put('/:id', auth, checkRole(['admin']), paymentMethodController.updatePaymentMethod);

/**
 * @route DELETE /api/payment-methods/:id
 * @desc Eliminar método de pago
 * @access Privado (solo admin)
 */
router.delete('/:id', auth, checkRole(['admin']), paymentMethodController.deletePaymentMethod);

export default router;
