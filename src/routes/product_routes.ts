import express from 'express';
const router = express.Router();
import {  auth  } from '../middlewares/auth';
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
import {  checkRole  } from '../middlewares/auth';

router.get('/', getAllProducts);

// Added routes for filtering by name and price
router.get('/search', getProductByNames);
router.get('/price', getProductByPrice);

// Moved the category route BEFORE the :id route to prevent conflicts
router.get('/category/:categoryId', getProductByCategory);


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

router.post('/', auth, checkRole(["vendor", "admin"]), createProduct);

router.put('/:id', auth, checkRole(["vendor", "admin"]), updateProduct);


router.delete('/:id', auth, checkRole(["vendor", "admin"]), deleteProduct);

export default router;