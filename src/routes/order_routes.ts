import express from 'express';
const router = express.Router();
import {  auth, checkRole  } from '../middlewares/auth';
import * as orderController from '../controllers/order_controller';

/**
 * @swagger
 * /api/orders/delivery-types:
 *   get:
 *     summary: Obtener tipos de entrega disponibles
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Lista de tipos de entrega
 */
router.get('/delivery-types', orderController.getDeliveryTypes);

// Todas las rutas de órdenes requieren autenticación
router.use(auth);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Crear nueva orden
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - deliveryType
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *               deliveryType:
 *                 type: string
 *               address:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Orden creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/', orderController.createOrder);

/**
 * @swagger
 * /api/orders/my-orders:
 *   get:
 *     summary: Obtener órdenes del usuario autenticado
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de órdenes del usuario
 *       401:
 *         description: No autorizado
 */
router.get('/my-orders', orderController.getUserOrders);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Obtener todas las órdenes (admin/vendor)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filtrar por estado
 *     responses:
 *       200:
 *         description: Lista de todas las órdenes
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Rol insuficiente
 */
router.get('/', checkRole(["admin", "vendor"]), orderController.getAllOrders);

/**
 * @swagger
 * /api/orders/user/{userId}:
 *   get:
 *     summary: Obtener órdenes de un usuario específico
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Órdenes del usuario obtenidas
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Rol insuficiente
 */
router.get('/user/:userId', checkRole(["admin", "vendor"]), orderController.getUserOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Obtener detalle de una orden
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden
 *     responses:
 *       200:
 *         description: Detalle de la orden
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos para esta orden
 *       404:
 *         description: Orden no encontrada
 */
router.get('/:id', checkRole(["customer", "admin", "vendor"]), orderController.getOrderById);

/**
 * @swagger
 * /api/orders/{id}/history:
 *   get:
 *     summary: Obtener historial de estados de una orden
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden
 *     responses:
 *       200:
 *         description: Historial de estados de la orden
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Orden no encontrada
 */
router.get('/:id/history', orderController.getOrderStatusHistory);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     summary: Cancelar una orden
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden
 *     responses:
 *       200:
 *         description: Orden cancelada exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos para cancelar esta orden
 *       404:
 *         description: Orden no encontrada
 */
router.post('/:id/cancel', orderController.updateOrderStatus);

/**
 * @swagger
 * /api/orders/{id}/payment:
 *   post:
 *     summary: Procesar pago de una orden
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *               paymentReference:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pago procesado exitosamente
 *       400:
 *         description: Error en el pago
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Orden no encontrada
 */
router.post('/:id/payment', orderController.processPayment);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Actualizar estado de una orden (admin/vendor)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, processing, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Rol insuficiente
 *       404:
 *         description: Orden no encontrada
 */
router.put('/:id/status', checkRole(["admin", "vendor", "staff"]), orderController.updateOrderStatus);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Actualizar estado de una orden (alias PATCH)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 */
router.patch('/:id/status', checkRole(["admin", "vendor", "staff"]), orderController.updateOrderStatus);

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Actualizar campos de una orden (admin/vendor)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Orden actualizada exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Rol insuficiente
 *       404:
 *         description: Orden no encontrada
 */
router.put('/:id', checkRole(["admin", "vendor"]), orderController.updateOrder);

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Eliminar una orden (solo admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden
 *     responses:
 *       200:
 *         description: Orden eliminada exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Rol insuficiente
 *       404:
 *         description: Orden no encontrada
 */
router.delete('/:id', checkRole(["admin"]), orderController.deleteOrder);

/**
 * @swagger
 * /api/orders/{id}/payment-proof:
 *   post:
 *     summary: Subir comprobante de pago de una orden
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Comprobante subido exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Orden no encontrada
 */
router.post('/:id/payment-proof', orderController.uploadPaymentProof);

export default router;