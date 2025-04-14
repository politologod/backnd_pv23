const { Order, OrderItem, Product, User } = require("../models");
const sequelize = require("../configs/database");

// Función auxiliar para calcular el total de una orden
const calcularTotal = (cartItems) => {
	return cartItems.reduce((total, item) => {
		return total + item.price * item.quantity;
	}, 0);
};

const VALID_PAYMENT_METHODS = [
	"transferencia",
	"pago_movil",
	"punto_venta",
	"efectivo_divisa_USD",
	"tarjeta",
    "zelle",
    "paypal",
    "efectivo_bolivares",
    "efectivo_divisa_EUR"
];

// Crear una nueva orden (con transacción)
createOrder = async (req, res) => {
	// Iniciamos una transacción
	const t = await sequelize.transaction();

	try {
		// Extraemos datos de la solicitud
		const { cartItems, shippingAddress, paymentMethod } = req.body;
		const userId = req.user.id; // Obtenido del token JWT
        console.log("Usuario autenticado:", req.user);
        console.log("this is userId:", userId);

		// Validaciones básicas
		if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
			return res.status(400).json({ error: "El carrito está vacío" });
		}

		if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
			return res.status(400).json({
				error: "Método de pago no válido",
				validMethods: VALID_PAYMENT_METHODS,
			});
		}

		if (!shippingAddress) {
			return res
				.status(400)
				.json({ error: "La dirección de envío es obligatoria" });
		}

		// Verificar existencia y stock de productos
		const productIds = cartItems.map((item) => item.productId);
		const products = await Product.findAll({
			where: { id: productIds },
			transaction: t,
		});

		// Crear mapa de productos para fácil acceso
		const productMap = {};
		products.forEach((product) => {
			productMap[product.id] = product;
		});

		// Verificar stock y calcular totales correctos
		let total = 0;
		const orderItems = [];

		for (const item of cartItems) {
			const product = productMap[item.productId];

			// Verificar que el producto existe
			if (!product) {
				await t.rollback();
				return res.status(404).json({
					error: `Producto con ID ${item.productId} no encontrado`,
				});
			}

			// Verificar stock suficiente
			if (product.stock < item.quantity) {
				await t.rollback();
				return res.status(400).json({
					error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`,
				});
			}

			// Añadir al total
			const itemTotal = product.price * item.quantity;
			total += itemTotal;

			// Preparar item para la orden
			orderItems.push({
				productId: product.id,
				quantity: item.quantity,
				priceAtPurchase: product.price,
			});
		}

		// Crear la orden
		const order = await Order.create(
			{
				total,
				status: "pendiente por pagar",
				shippingAddress,
				userId,
				paymentMethod: paymentMethod || "tarjeta",
			},
			{ transaction: t }
		);

		// Crear items de la orden
		await Promise.all(
			orderItems.map(async (item) => {
				await OrderItem.create(
					{
						...item,
						orderId: order.id,
					},
					{ transaction: t }
				);

				// Actualizar stock del producto
				await Product.decrement("stock", {
					by: item.quantity,
					where: { id: item.productId },
					transaction: t,
				});
			})
		);

		// TODO: Si tienes un modelo Cart, aquí deberías limpiar el carrito del usuario

		// Confirmar la transacción
		await t.commit();

		// Devolver la orden creada con sus items
const orderWithItems = await Order.findByPk(order.id, {
	include: [OrderItem, { model: User, attributes: { exclude: ["password"] } }],
	attributes: { exclude: ["userId"] },
});

// Convertimos a JSON para mayor seguridad si se quiere modificar
const orderJson = orderWithItems.toJSON();

// Si por alguna razón el password aún aparece (por ejemplo, si se usa `User.rawAttributes`)
if (orderJson.User?.password) {
	delete orderJson.User.password;
}

res.status(201).json({
	message: "Orden creada exitosamente",
	order: orderJson,
});

	} catch (error) {
		// Si algo sale mal, revertimos todos los cambios
		await t.rollback();
		console.error("Error al crear orden:", error);
		res.status(500).json({
			error: "Error al crear la orden",
			details: error.message,
		});
	}
};

// Obtener todas las órdenes (admin/vendor)
getAllOrders = async (req, res) => {
	try {
		const orders = await Order.findAll({
			include: [
				{
					model: OrderItem,
					include: [Product],
				},
				{
					model: User,
					attributes: ["id_autoincrement", "name", "email"],
				},
			],
			order: [["createdAt", "DESC"]],
		});

		res.json(orders);
	} catch (error) {
		console.error("Error al obtener órdenes:", error);
		res.status(500).json({ error: error.message });
	}
};

// Obtener orden por ID
getOrderById = async (req, res) => {
	try {
		const { id } = req.params;

		const order = await Order.findByPk(id, {
			include: [
				{
					model: OrderItem,
					include: [Product],
				},
				{
					model: User,
					attributes: ["id_autoincrement", "name", "email"],
				},
			],
		});

		if (!order) {
			return res.status(404).json({ error: "Orden no encontrada" });
		}

		// Verificar si el usuario es admin/vendor o es el dueño de la orden
		if (
			req.user.role !== "admin" &&
			req.user.role !== "vendor" &&
			order.userId !== req.user.id
		) {
			return res
				.status(403)
				.json({ error: "No tienes permiso para ver esta orden" });
		}

		res.json(order);
	} catch (error) {
		console.error("Error al obtener orden:", error);
		res.status(500).json({ error: error.message });
	}
};

// Obtener órdenes de un usuario específico
getUserOrders = async (req, res) => {
	try {
		const { userId } = req.params;

		// Verificar que el usuario actual puede acceder a estas órdenes
		if (
			req.user.role !== "admin" &&
			req.user.role !== "vendor" &&
			req.user.id !== parseInt(userId)
		) {
			return res
				.status(403)
				.json({ error: "No tienes permiso para ver estas órdenes" });
		}

		const orders = await Order.findAll({
			where: { userId },
			include: [
				{
					model: OrderItem,
					include: [Product],
				},
			],
			order: [["createdAt", "DESC"]],
		});

		res.json(orders);
	} catch (error) {
		console.error("Error al obtener órdenes del usuario:", error);
		res.status(500).json({ error: error.message });
	}
};

// Actualizar estado de una orden
updateOrderStatus = async (req, res) => {
	const t = await sequelize.transaction();

	try {
		const { id } = req.params;
		const { status } = req.body;

		// Validar el nuevo estado
		const validStatuses = [
			"pendiente por pagar",
			"pagado y procesando",
			"enviado",
			"entregado",
			"cancelado",
		];

		if (!validStatuses.includes(status)) {
			return res.status(400).json({
				error: "Estado no válido",
				validStatuses,
			});
		}

		// Encontrar la orden
		const order = await Order.findByPk(id, { transaction: t });

		if (!order) {
			await t.rollback();
			return res.status(404).json({ error: "Orden no encontrada" });
		}

		// Si vamos a cancelar una orden, devolvemos el stock
		if (status === "cancelado" && order.status !== "cancelado") {
			// Obtener los items de la orden
			const orderItems = await OrderItem.findAll({
				where: { orderId: id },
				transaction: t,
			});

			// Devolver stock por cada item
			await Promise.all(
				orderItems.map(async (item) => {
					await Product.increment("stock", {
						by: item.quantity,
						where: { id: item.productId },
						transaction: t,
					});
				})
			);
		}

		// Actualizar estado
		await order.update({ status }, { transaction: t });

		// Confirmar transacción
		await t.commit();

		// Retornar orden actualizada
		const updatedOrder = await Order.findByPk(id, {
			include: [OrderItem],
		});

		res.json({
			message: `Orden actualizada a estado: ${status}`,
			order: updatedOrder,
		});
	} catch (error) {
		await t.rollback();
		console.error("Error al actualizar estado de orden:", error);
		res.status(500).json({ error: error.message });
	}
};

// Procesar pago de una orden
processPayment = async (req, res) => {
	const t = await sequelize.transaction();

	try {
		const { id } = req.params;
		const { paymentMethod, paymentDetails } = req.body;

		// Validaciones
		if (!paymentMethod) {
			return res.status(400).json({ error: "Método de pago requerido" });
		}

		// Encontrar la orden
		const order = await Order.findByPk(id, { transaction: t });

		if (!order) {
			await t.rollback();
			return res.status(404).json({ error: "Orden no encontrada" });
		}

		// Verificar que la orden está pendiente por pagar
		if (order.status !== "pendiente por pagar") {
			await t.rollback();
			return res.status(400).json({
				error: "No se puede procesar el pago en el estado actual de la orden",
			});
		}

		// Aquí iría la integración con un gateway de pago real
		// Por ejemplo: Stripe, PayPal, etc.
		// Esto es un simulador:

		// Simulación de procesamiento de pago
		const paymentSuccess = Math.random() > 0.1; // 90% de éxito

		if (!paymentSuccess) {
			await t.rollback();
			return res.status(400).json({
				error: "Error al procesar el pago. Por favor, intente nuevamente.",
			});
		}

		// Actualizar orden a pagada
		await order.update(
			{
				status: "pagado y procesando",
				paymentMethod,
			},
			{ transaction: t }
		);

		// Confirmar transacción
		await t.commit();

		res.json({
			message: "Pago procesado exitosamente",
			order: await Order.findByPk(id, { include: [OrderItem] }),
		});
	} catch (error) {
		await t.rollback();
		console.error("Error al procesar pago:", error);
		res.status(500).json({ error: error.message });
	}
};

// Actualizar una orden (campos generales)
updateOrder = async (req, res) => {
	try {
		const { id } = req.params;
		const order = await Order.findByPk(id);

		if (!order) {
			return res.status(404).json({ error: "Orden no encontrada" });
		}

		// Permitir actualizar solo ciertos campos
		const allowedFields = [
			"shippingAddress",
			"trackingNumber",
			"paymentMethod",
		];
		const updates = {};

		allowedFields.forEach((field) => {
			if (req.body[field] !== undefined) {
				updates[field] = req.body[field];
			}
		});

		await order.update(updates);
		res.json({
			message: "Orden actualizada correctamente",
			order,
		});
	} catch (error) {
		console.error("Error al actualizar orden:", error);
		res.status(500).json({ error: error.message });
	}
};

// Eliminar una orden
deleteOrder = async (req, res) => {
	const t = await sequelize.transaction();

	try {
		const { id } = req.params;
		const order = await Order.findByPk(id, { transaction: t });

		if (!order) {
			await t.rollback();
			return res.status(404).json({ error: "Orden no encontrada" });
		}

		// Si la orden no está cancelada, devolvemos stock
		if (order.status !== "cancelado") {
			// Obtener items
			const orderItems = await OrderItem.findAll({
				where: { orderId: id },
				transaction: t,
			});

			// Devolver stock
			await Promise.all(
				orderItems.map(async (item) => {
					await Product.increment("stock", {
						by: item.quantity,
						where: { id: item.productId },
						transaction: t,
					});
				})
			);
		}

		// Eliminar items relacionados primero
		await OrderItem.destroy({
			where: { orderId: id },
			transaction: t,
		});

		// Eliminar la orden
		await order.destroy({ transaction: t });

		// Confirmar transacción
		await t.commit();

		res.json({ message: "Orden eliminada con éxito" });
	} catch (error) {
		await t.rollback();
		console.error("Error al eliminar orden:", error);
		res.status(500).json({ error: error.message });
	}
};


const updatingStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const order = await Order.findByPk(id);

        if (!order) {
            return res.status(404).json({ error: "Orden no encontrada" });
        }

        await order.update({ status });
        res.json({
            message: `Estado de la orden actualizado a: ${status}`,
            order,
        });
    } catch (error) {
        console.error("Error al actualizar estado de orden:", error);
        res.status(500).json({ error: error.message });
    }
};



module.exports = {
	createOrder,
	getAllOrders,
	getOrderById,
	getUserOrders,
	updateOrder,
	deleteOrder,
	updateOrderStatus,
	processPayment,
    updatingStatus,
};
