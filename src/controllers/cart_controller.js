const Cart = require('../models/model_cart');
const CartItem = require('../models/model_cartItem');
const Product = require('../models/model_products');

exports.addItemToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Se requiere productId y una cantidad válida' 
            });
        }

        // Check if product exists
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({   
                success: false, 
                message: 'Producto no encontrado' 
            });
        }

        // Find or create cart
        let cart = await Cart.findOne({ where: { UserIdAutoincrement: userId } });
        if (!cart) {
            cart = await Cart.create({ UserIdAutoincrement: userId });
        }

        // Find or create cart item
        let cartItem = await CartItem.findOne({
            where: { cartId: cart.id, productId }
        });

        if (cartItem) {
            // Update quantity if item exists
            cartItem.quantity += parseInt(quantity);
            await cartItem.save();
        } else {
            // Create new item if it doesn't exist
            cartItem = await CartItem.create({
                cartId: cart.id,
                productId,
                quantity: parseInt(quantity)
            });
        }

        // Get updated cart
        const updatedCart = await Cart.findByPk(cart.id, {
            include: [{
                model: CartItem,
                include: [Product]
            }]
        });

        res.status(200).json({ success: true, cart: updatedCart });
    } catch (error) {
        console.error('Error al agregar item al carrito:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Remove item from cart
exports.removeItemFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body;

        // Buscar el carrito del usuario
        const cart = await Cart.findOne({
            where: { UserIdAutoincrement: userId }
        });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Carrito no encontrado' });
        }

        // Eliminar el item del carrito
        await CartItem.destroy({
            where: {
                cartId: cart.id,
                productId
            }
        });

        // Obtener el carrito actualizado
        const updatedCart = await Cart.findByPk(cart.id, {
            include: [{
                model: CartItem,
                include: [Product]
            }]
        });

        res.status(200).json({ success: true, cart: updatedCart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get cart details
exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id;

        // Buscar el carrito con sus items y productos
        const cart = await Cart.findOne({
            where: { UserIdAutoincrement: userId },
            include: [{
                model: CartItem,
                include: [Product]
            }]
        });

        if (!cart) {
            // Si no existe, crear un carrito vacío
            const newCart = await Cart.create({ UserIdAutoincrement: userId });
            return res.status(200).json({ success: true, cart: newCart, items: [] });
        }

        res.status(200).json({ success: true, cart });
    } catch (error) {
        console.error('Error al obtener carrito:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Clear cart
exports.clearCart = async (req, res) => {
    try {
        const userId = req.user.id;

        // Buscar el carrito
        const cart = await Cart.findOne({
            where: { UserIdAutoincrement: userId }
        });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Carrito no encontrado' });
        }

        // Eliminar todos los items del carrito
        await CartItem.destroy({
            where: { cartId: cart.id }
        });

        res.status(200).json({ success: true, message: 'Carrito vaciado' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};