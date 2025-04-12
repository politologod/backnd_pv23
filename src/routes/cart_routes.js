const express = require('express');
const cart_controller = require('../controllers/cart_controller');
const { auth } = require('../middlewares/auth');
const { checkRole } = require('../middlewares/auth');

const router = express.Router();

// Get current user's cart
router.get('/:userId', auth, cart_controller.getCart);

// Add an item to the cart
router.post('/', auth, cart_controller.addItemToCart);

// Remove an item from the cart
router.delete('/', auth, cart_controller.removeItemFromCart);

// Clear the cart
router.delete('/clear', auth, cart_controller.clearCart);

module.exports = router;