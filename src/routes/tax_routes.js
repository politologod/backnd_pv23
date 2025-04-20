const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middlewares/auth');
const {
  getAllTaxes,
  getTaxById,
  createTax,
  updateTax,
  deleteTax,
  updateProductTax,
  deleteProductTax,
  calculateCartTaxes
} = require('../controllers/tax_controller');

/**
 * @swagger
 * /api/taxes:
 *   get:
 *     summary: Obtener todos los impuestos
 *     tags: [Taxes]
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filtrar por país
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *         description: Filtrar por región
 *     responses:
 *       200:
 *         description: Lista de impuestos
 */
router.get('/', getAllTaxes);

/**
 * @swagger
 * /api/taxes/{id}:
 *   get:
 *     summary: Obtener un impuesto por ID
 *     tags: [Taxes]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del impuesto
 *     responses:
 *       200:
 *         description: Detalles del impuesto
 *       404:
 *         description: Impuesto no encontrado
 */
router.get('/:id', getTaxById);

/**
 * @swagger
 * /api/taxes:
 *   post:
 *     summary: Crear un nuevo impuesto
 *     tags: [Taxes]
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
 *               - code
 *               - rate
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del impuesto
 *               code:
 *                 type: string
 *                 description: Código único del impuesto
 *               description:
 *                 type: string
 *                 description: Descripción del impuesto
 *               rate:
 *                 type: number
 *                 description: Tasa del impuesto
 *               is_percentage:
 *                 type: boolean
 *                 default: true
 *                 description: Si es porcentaje (true) o monto fijo (false)
 *               applies_to_all:
 *                 type: boolean
 *                 default: true
 *                 description: Si se aplica a todos los productos por defecto
 *               country:
 *                 type: string
 *                 description: País donde aplica el impuesto
 *               region:
 *                 type: string
 *                 description: Región donde aplica el impuesto
 *               active:
 *                 type: boolean
 *                 default: true
 *                 description: Estado del impuesto
 *     responses:
 *       201:
 *         description: Impuesto creado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/', auth, checkRole(['admin']), createTax);

/**
 * @swagger
 * /api/taxes/{id}:
 *   put:
 *     summary: Actualizar un impuesto
 *     tags: [Taxes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del impuesto
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
 *               rate:
 *                 type: number
 *               is_percentage:
 *                 type: boolean
 *               applies_to_all:
 *                 type: boolean
 *               country:
 *                 type: string
 *               region:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Impuesto actualizado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Impuesto no encontrado
 */
router.put('/:id', auth, checkRole(['admin']), updateTax);

/**
 * @swagger
 * /api/taxes/{id}:
 *   delete:
 *     summary: Eliminar un impuesto
 *     tags: [Taxes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del impuesto
 *     responses:
 *       200:
 *         description: Impuesto eliminado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Impuesto no encontrado
 */
router.delete('/:id', auth, checkRole(['admin']), deleteTax);

/**
 * @swagger
 * /api/taxes/products/{productId}/taxes/{taxId}:
 *   put:
 *     summary: Asignar o actualizar un impuesto a un producto
 *     tags: [Taxes]
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
 *         name: taxId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del impuesto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_exempt:
 *                 type: boolean
 *                 description: Si el producto está exento de este impuesto
 *               custom_rate:
 *                 type: number
 *                 description: Tasa personalizada para este producto
 *     responses:
 *       200:
 *         description: Asignación actualizada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Producto o impuesto no encontrado
 */
router.put('/products/:productId/taxes/:taxId', auth, checkRole(['admin']), updateProductTax);

/**
 * @swagger
 * /api/taxes/products/{productId}/taxes/{taxId}:
 *   delete:
 *     summary: Eliminar asignación de impuesto a producto
 *     tags: [Taxes]
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
 *         name: taxId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del impuesto
 *     responses:
 *       200:
 *         description: Asignación eliminada
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Asignación no encontrada
 */
router.delete('/products/:productId/taxes/:taxId', auth, checkRole(['admin']), deleteProductTax);

/**
 * @swagger
 * /api/taxes/calculate:
 *   post:
 *     summary: Calcular impuestos para un carrito
 *     tags: [Taxes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Cálculo de impuestos
 *       400:
 *         description: Datos inválidos
 */
router.post('/calculate', calculateCartTaxes);

module.exports = router; 