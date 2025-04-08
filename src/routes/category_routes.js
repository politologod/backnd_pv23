const express = require('express');
const {auth, checkRole} = require('../middlewares/auth');
const router = express.Router();

// Controller functions (to be implemented)
const {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/category_controller');

// Routes
router.get('/', getAllCategories); // Get all categories
router.get('/:id', getCategoryById); // Get category by ID
router.post('/', auth, checkRole(["vendor", "admin"]), createCategory); // Create a new category
router.put('/:id', auth, checkRole(["vendor", "admin"]), updateCategory); // Update a category by ID
router.delete('/:id', auth, checkRole(["vendor", "admin"]), deleteCategory); // Delete a category by ID

module.exports = router;