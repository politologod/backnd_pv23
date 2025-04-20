const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middlewares/auth');
const orderController = require('../controllers/order_controller');

// Todas las rutas de órdenes requieren autenticación
router.use(auth);

// Rutas públicas (para usuarios autenticados)
// Crear una nueva orden
router.post('/', orderController.createOrder);

// Obtener las órdenes del usuario autenticado
router.get('/my-orders', orderController.getUserOrders);

// Cancelar una orden (solo el dueño de la orden)
router.post('/:id/cancel', orderController.updateOrderStatus);

// Procesar pago de una orden
router.post('/:id/payment', orderController.processPayment);

// Obtener detalle de una orden específica (verificación de propiedad en el controlador)
router.get('/:id', checkRole(["customer", "admin", "vendor"]), orderController.getOrderById);

// Obtener historial de estados de una orden
router.get('/:id/history', orderController.getOrderStatusHistory);

// Rutas para admin/vendor
// Obtener todas las órdenes
router.get('/', checkRole(["admin", "vendor"]), orderController.getAllOrders);

// Obtener órdenes de un usuario específico
router.get('/user/:userId', checkRole(["admin", "vendor"]), orderController.getUserOrders);

// Actualizar estado de una orden
router.put('/:id/status', checkRole(["admin", "vendor"]), orderController.updateOrderStatus);

// Actualizar campos generales de una orden
router.put('/:id', checkRole(["admin", "vendor"]), orderController.updateOrder);

// Eliminar una orden (solo admin)
router.delete('/:id', checkRole(["admin"]), orderController.deleteOrder);

// Recibir confirmación de pago y subir comprobante
router.post('/:id/payment-proof', orderController.uploadPaymentProof);

module.exports = router;