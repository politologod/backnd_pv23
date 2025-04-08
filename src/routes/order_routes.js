const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middlewares/auth');
const {createOrder, updateOrder, deleteOrder, getAllOrders, getOrderById} = require('../controllers/order_controller');
const pagination = require('../middlewares/pagination');
// TODO: Importar el controlador de órdenes cuando esté creado
// const orderController = require('../controllers/orderController');

// Todas las rutas de órdenes requieren autenticación
router.use(auth);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Obtener lista de órdenes
 *     description: Retorna una lista paginada de órdenes
 *     tags: [Órdenes]
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
 *         description: Cantidad de órdenes por página
 *     responses:
 *       200:
 *         description: Lista de órdenes obtenida exitosamente
 *       401:
 *         description: No autorizado
 */
router.get('/', checkRole(["vendor", "admin"]), getAllOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Obtener detalle de una orden
 *     description: Retorna los detalles de una orden específica
 *     tags: [Órdenes]
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
 *         description: Detalles de la orden obtenidos exitosamente
 *       404:
 *         description: Orden no encontrada
 *       401:
 *         description: No autorizado
 */
router.get('/:id', (req, res) => {
    res.json({ message: 'Detalle de la orden' });
});

/**
 * @swagger
 * /api/orders/from-cart:
 *   post:
 *     summary: Crear orden desde carrito
 *     description: Crea una nueva orden a partir del carrito del usuario
 *     tags: [Órdenes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *               - paymentMethod
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *                   country:
 *                     type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, paypal, crypto]
 *     responses:
 *       201:
 *         description: Orden creada exitosamente
 *       400:
 *         description: Error en la solicitud
 *       401:
 *         description: No autorizado
 */
router.post('/from-cart', (req, res) => {
    res.json({ message: 'Crear orden desde carrito' });
});

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Actualizar una orden
 *     description: Actualiza los detalles de una orden existente
 *     tags: [Órdenes]
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
 *               shippingAddress:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Orden actualizada exitosamente
 *       404:
 *         description: Orden no encontrada
 *       401:
 *         description: No autorizado
 */
router.put('/:id', (req, res) => {
    res.json({ message: 'Actualizar orden' });
});

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Eliminar una orden
 *     description: Elimina una orden del sistema
 *     tags: [Órdenes]
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
 *       404:
 *         description: Orden no encontrada
 *       401:
 *         description: No autorizado
 */
router.delete('/:id', (req, res) => {
    res.json({ message: 'Eliminar orden' });
});

/**
 * @swagger
 * /api/orders/user/{userId}:
 *   get:
 *     summary: Obtener órdenes de un usuario
 *     description: Retorna una lista paginada de órdenes de un usuario específico
 *     tags: [Órdenes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
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
 *         description: Cantidad de órdenes por página
 *     responses:
 *       200:
 *         description: Lista de órdenes del usuario obtenida exitosamente
 *       401:
 *         description: No autorizado
 */
router.get('/user/:userId', auth, checkRole([ "customer", "vendor", "admin"]), getOrderById);



/**
 * @swagger
 * /api/orders/{id}/status:
 *   post:
 *     summary: Actualizar estado de una orden
 *     description: Actualiza el estado de una orden
 *     tags: [Órdenes]
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
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Estado de la orden actualizado exitosamente
 *       404:
 *         description: Orden no encontrada
 *       401:
 *         description: No autorizado
 */
router.post('/:id/status', (req, res) => {
    res.json({ message: 'Actualizar estado de la orden' });
});

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     summary: Cancelar una orden
 *     description: Cancela una orden existente
 *     tags: [Órdenes]
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
 *       404:
 *         description: Orden no encontrada
 *       401:
 *         description: No autorizado
 */
router.post('/:id/cancel', (req, res) => {
    res.json({ message: 'Cancelar orden' });
});

/**
 * @swagger
 * /api/orders/{id}/complete:
 *   post:
 *     summary: Completar una orden
 *     description: Marca una orden como completada
 *     tags: [Órdenes]
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
 *         description: Orden completada exitosamente
 *       404:
 *         description: Orden no encontrada
 *       401:
 *         description: No autorizado
 */
router.post('/:id/complete', (req, res) => {
    res.json({ message: 'Completar orden' });
});

/**
 * @swagger
 * /api/orders/{id}/payment:
 *   post:
 *     summary: Procesar pago de una orden
 *     description: Procesa el pago de una orden
 *     tags: [Órdenes]
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
 *               - paymentMethod
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, paypal, crypto]
 *               paymentDetails:
 *                 type: object
 *     responses:
 *       200:
 *         description: Pago procesado exitosamente
 *       400:
 *         description: Error en el procesamiento del pago
 *       404:
 *         description: Orden no encontrada
 *       401:
 *         description: No autorizado
 */
router.post('/:id/payment', (req, res) => {
    res.json({ message: 'Procesar pago de la orden' });
});

/**
 * @swagger
 * /api/orders/{id}/payment-status:
 *   get:
 *     summary: Obtener estado del pago
 *     description: Retorna el estado del pago de una orden
 *     tags: [Órdenes]
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
 *         description: Estado del pago obtenido exitosamente
 *       404:
 *         description: Orden no encontrada
 *       401:
 *         description: No autorizado
 */
router.get('/:id/payment-status', (req, res) => {
    res.json({ message: 'Obtener estado del pago' });
});

module.exports = router; 