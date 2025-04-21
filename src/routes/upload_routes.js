const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middlewares/auth');
const { upload, handleMulterError, cleanupTempFiles } = require('../middlewares/upload');
const { 
  uploadProductImageController, 
  uploadMultipleProductImagesController,
  uploadPaymentProofController,
  deleteProductImageController
} = require('../controllers/upload_controller');

/**
 * @swagger
 * /api/uploads/products/{productId}/image:
 *   post:
 *     summary: Subir imagen principal de producto
 *     description: Sube una imagen para un producto y la establece como imagen principal
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del producto
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
 *         description: Imagen subida exitosamente
 *       400:
 *         description: Error en la solicitud
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Producto no encontrado
 */
router.post(
  '/products/:productId/image',
  auth,
  checkRole(['admin', 'vendor']),
  cleanupTempFiles,
  upload.single('image'),
  handleMulterError,
  uploadProductImageController
);

/**
 * @swagger
 * /api/uploads/products/{productId}/images:
 *   post:
 *     summary: Subir múltiples imágenes de producto
 *     description: Sube múltiples imágenes para un producto
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Imágenes subidas exitosamente
 *       400:
 *         description: Error en la solicitud
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Producto no encontrado
 */
router.post(
  '/products/:productId/images',
  auth,
  checkRole(['admin', 'vendor']),
  cleanupTempFiles,
  upload.array('images', 5),
  handleMulterError,
  uploadMultipleProductImagesController
);

/**
 * @swagger
 * /api/uploads/orders/{orderId}/payment-proof:
 *   post:
 *     summary: Subir comprobante de pago
 *     description: Sube una imagen de comprobante de pago para una orden
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         schema:
 *           type: integer
 *         required: true
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
 *         description: Comprobante de pago subido exitosamente
 *       400:
 *         description: Error en la solicitud
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos para esta orden
 *       404:
 *         description: Orden no encontrada
 */
router.post(
  '/orders/:orderId/payment-proof',
  auth,
  cleanupTempFiles,
  upload.single('image'),
  handleMulterError,
  uploadPaymentProofController
);

/**
 * @swagger
 * /api/uploads/products/{productId}/images/{imageId}:
 *   delete:
 *     summary: Eliminar imagen de producto
 *     description: Elimina una imagen asociada a un producto
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del producto
 *       - in: path
 *         name: imageId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID público de la imagen en Cloudinary
 *     responses:
 *       200:
 *         description: Imagen eliminada exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Producto o imagen no encontrados
 */
router.delete(
  '/products/:productId/images/:imageId',
  auth,
  checkRole(['admin', 'vendor']),
  deleteProductImageController
);

/**
 * @swagger
 * /api/uploads/products/{productId}/deleteimage:
 *   delete:
 *     summary: Eliminar imagen de producto
 *     description: Elimina una imagen asociada a un producto usando query parameter
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del producto
 *       - in: query
 *         name: publicId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID público de la imagen en Cloudinary
 *       - in: query
 *         name: isMain
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Si es true, elimina la imagen principal
 *     responses:
 *       200:
 *         description: Imagen eliminada exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Producto o imagen no encontrados
 */
router.delete(
  '/products/:productId/deleteimage',
  auth,
  checkRole(['admin', 'vendor']),
  deleteProductImageController
);

module.exports = router; 