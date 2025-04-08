const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const {
    createProduct, 
    updateProduct, 
    deleteProduct, 
    getAllProducts, 
    getProductById, 
    getProductByCategory,
    getProductByNames,
    getProductByPrice
} = require('../controllers/product_controller');
const { checkRole } = require('../middlewares/auth');

router.get('/', getAllProducts);

// Added routes for filtering by name and price
router.get('/search', getProductByNames);
router.get('/price', getProductByPrice);

// Moved the category route BEFORE the :id route to prevent conflicts
router.get('/category/:categoryId', getProductByCategory);


router.get('/:id', getProductById);


router.post('/', auth, checkRole(["vendor", "admin"]), createProduct);

router.put('/:id', auth, checkRole(["vendor", "admin"]), updateProduct);


router.delete('/:id', auth, checkRole(["vendor", "admin"]), deleteProduct);

module.exports = router;