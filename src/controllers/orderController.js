const { Order } = require("../models/model_order");
const { OrderItem } = require("../models/model_orderItem");
const { Product } = require("../models/model_products");

const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({ error: "Orden no encontrada" });
        }
        await
        order.update(req.body);
        res.json(order);
    }

    catch (error) {
        res.status(400).json({ error: error.message });
    }
}       

const deleteOrder = async (req, res) => {

    try {
        const { id } = req.params;
        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({ error: "Orden no encontrada" });
        }
        await order.destroy();
        res.json({ message: "Orden eliminada con éxito." });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }

}

const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({ include: OrderItem });
        res.json(orders);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}


const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findByPk(id, { include: OrderItem });
        if (!order) {
            return res.status(404).json({ error: "Orden no encontrada" });
        }
        res.json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}






const createOrder = async (req, res) => {
	const t = await sequelize.transaction();
	try {
		const { cartItems, shippingAddress } = req.body;
		const total = calcularTotal(cartItems);
		const order = await Order.create(
			{ total, shippingAddress, userId: req.user.id },
			{ transaction: t }
		);

		// Crear OrderItems y actualizar stock
		await Promise.all(
			cartItems.map(async (item) => {
				await OrderItem.create(
					{ ...item, orderId: order.id },
					{ transaction: t }
				);
				await Product.decrement("stock", {
					by: item.quantity,
					where: { id: item.productId },
					transaction: t,
				});
			})
		);

		await t.commit();
		res.status(201).json(order);
	} catch (error) {
		await t.rollback();
		res.status(500).json({ error: "Error al crear la orden" });
	}
};



module.exports = { createOrder, getAllOrders, getOrderById, deleteOrder, updateOrder };