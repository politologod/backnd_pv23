import express from 'express';
import * as cart_controller from '../controllers/cart_controller';
import {  auth  } from '../middlewares/auth';
import {  checkRole  } from '../middlewares/auth';

const router = express.Router();

/**
 * @swagger
 * /api/cart/{userId}:
 *   get:
 *     summary: Obtener carrito del usuario
 *     tags: [Cart]
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
 *         description: Carrito del usuario obtenido exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Carrito no encontrado
 */
router.get('/:userId', auth, cart_controller.getCart);

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Agregar item al carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Item agregado al carrito exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/', auth, cart_controller.addItemToCart);

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Eliminar item del carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item eliminado del carrito exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Item no encontrado en el carrito
 */
router.delete('/', auth, cart_controller.removeItemFromCart);

/**
 * @swagger
 * /api/cart/clear:
 *   delete:
 *     summary: Vaciar carrito completo
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrito vaciado exitosamente
 *       401:
 *         description: No autorizado
 */
router.delete('/clear', auth, cart_controller.clearCart);

export default router;