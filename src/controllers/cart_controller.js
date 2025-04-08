const Cart = require('../models/cartModel');

// Add item to cart
exports.addItemToCart = async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        } else {
            cart.items.push({ productId, quantity });
        }

        await cart.save();
        res.status(200).json({ success: true, cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Remove item from cart
exports.removeItemFromCart = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        await cart.save();

        res.status(200).json({ success: true, cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get cart details
exports.getCart = async (req, res) => {
    try {
        const { userId } = req.params;

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        res.status(200).json({ success: true, cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Clear cart
exports.clearCart = async (req, res) => {
    try {
        const { userId } = req.body;

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        cart.items = [];
        await cart.save();

        res.status(200).json({ success: true, message: 'Cart cleared' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};