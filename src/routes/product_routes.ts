import express from 'express';
const router = express.Router();
import { auth, checkRole } from '../middlewares/auth';
import { 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    getAllProducts, 
    getProductById, 
    getProductByCategory,
    getProductByNames,
    getProductByPrice,
    getProductWithTaxes
 } from '../controllers/product_controller';
import * as uploadController from '../controllers/upload_controller';

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Obtener todos los productos
 *     tags: [Products]
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
 *     responses:
 *       200:
 *         description: Lista de productos obtenida exitosamente
 */
router.get('/', getAllProducts);

/**
 * @swagger
 * /api/products/search:
 *   get:
 *     summary: Buscar productos por nombre
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: Nombre o parte del nombre del producto
 *     responses:
 *       200:
 *         description: Productos que coinciden con la búsqueda
 *       400:
 *         description: Parámetro de búsqueda faltante
 */
router.get('/search', getProductByNames);

/**
 * @swagger
 * /api/products/price:
 *   get:
 *     summary: Filtrar productos por rango de precio
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: min
 *         schema:
 *           type: number
 *         description: Precio mínimo
 *       - in: query
 *         name: max
 *         schema:
 *           type: number
 *         description: Precio máximo
 *     responses:
 *       200:
 *         description: Productos dentro del rango de precio
 */
router.get('/price', getProductByPrice);

/**
 * @swagger
 * /api/products/category/{categoryId}:
 *   get:
 *     summary: Obtener productos por categoría
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Productos de la categoría indicada
 *       404:
 *         description: Categoría no encontrada
 */
router.get('/category/:categoryId', getProductByCategory);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obtener producto por ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto encontrado
 *       404:
 *         description: Producto no encontrado
 */
router.get('/:id', getProductById);

/**
 * @swagger
 * /api/products/{id}/taxes:
 *   get:
 *     summary: Obtener un producto con su precio e impuestos incluidos
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto con detalles de impuestos y precio final
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: object
 *                     priceWithoutTax:
 *                       type: number
 *                     taxes:
 *                       type: array
 *                     totalTaxAmount:
 *                       type: number
 *                     priceWithTax:
 *                       type: number
 *       404:
 *         description: Producto no encontrado
 *       400:
 *         description: ID de producto inválido
 */
router.get('/:id/taxes', getProductWithTaxes);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Crear nuevo producto
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               categoryId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Rol insuficiente
 */
router.post('/', auth, checkRole(["vendor", "admin", "staff"]), createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Actualizar producto
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               categoryId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Rol insuficiente
 *       404:
 *         description: Producto no encontrado
 */
router.put('/:id', auth, checkRole(["vendor", "admin", "staff"]), updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Eliminar producto
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Rol insuficiente
 *       404:
 *         description: Producto no encontrado
 */
router.delete('/:id', auth, checkRole(["vendor", "admin", "staff"]), deleteProduct);

// === Image Route Aliases (el frontend espera /api/products/:id/images) ===

/**
 * @route POST /api/products/:id/images
 * @desc Subir imagen de producto (alias de /api/uploads/products/:productId/image)
 * @access Privado (admin/vendor/staff)
 */
router.post('/:id/images', auth, checkRole(["vendor", "admin", "staff"]), (req, res) => {
    req.params.productId = req.params.id;
    return uploadController.uploadProductImageController(req, res);
});

/**
 * @route POST /api/products/:id/images/multiple
 * @desc Subir múltiples imágenes de producto
 * @access Privado (admin/vendor/staff)
 */
router.post('/:id/images/multiple', auth, checkRole(["vendor", "admin", "staff"]), (req, res) => {
    req.params.productId = req.params.id;
    return uploadController.uploadMultipleProductImagesController(req, res);
});

/**
 * @route DELETE /api/products/:id/images/:imageId
 * @desc Eliminar imagen de producto
 * @access Privado (admin/vendor/staff)
 */
router.delete('/:id/images/:imageId', auth, checkRole(["vendor", "admin", "staff"]), (req, res) => {
    req.params.productId = req.params.id;
    return uploadController.deleteProductImageController(req, res);
});

export default router;