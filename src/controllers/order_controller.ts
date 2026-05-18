import {  Order, OrderItem, Product, User, OrderStatusHistory  } from '../models';
import sequelize from '../configs/database';
import logger from '../configs/logger';
import taxCalculator from '../utils/taxCalculator';
import EmailNotificationService from '../services/emailNotificationService';
import currencyService from '../services/currencyService';
import { Request, Response } from 'express';


// Función auxiliar para calcular el total de una orden (OBSOLETA, usando taxCalculator ahora)
const calcularTotal = (cartItems) => {
	return cartItems.reduce((total, item) => {
		return total + item.price * item.quantity;
	}, 0);
};

// Función auxiliar para registrar cambios de estado en el historial
const registerStatusChange = async (orderId, status, notes = null, user = null, transaction = null) => {
    try {
        const historyData = {
            orderId,
            status,
            notes,
            updatedBy: user?.id,
            updatedByRole: user?.role
        };
        
        if (transaction) {
            await OrderStatusHistory.create(historyData, { transaction });
        } else {
            await OrderStatusHistory.create(historyData);
        }
        
        logger.info(`Estado de orden ${orderId} actualizado a: ${status}`, {
            orderId,
            status,
            updatedBy: user?.id,
            updatedByRole: user?.role
        });
        
        return true;
    } catch (error) {
        logger.error(`Error al registrar cambio de estado para orden ${orderId}`, {
            error: error.message,
            orderId,
            status
        });
        return false;
    }
};

const VALID_PAYMENT_METHODS = [
	// Bolívares (VES)
	"transferencia_ves",        // Transferencia bancaria en bolívares
	"pago_movil",               // Pago móvil (Bancamiga, Mercantil, etc.)
	"punto_venta",              // Punto de venta en bolívares
	"efectivo_bolivares",       // Efectivo en bolívares
	// Dólares (USD)
	"efectivo_usd",             // Efectivo en dólares
	// Euros (EUR)
	"efectivo_eur",             // Efectivo en euros
	// Cripto
	"usdt",                     // Tether USDT
	// Internacional / General
	"tarjeta",                  // Tarjeta débito/crédito
	"transferencia_internacional", // Wire transfer internacional
	// Aliases legacy (compatibilidad con pedidos anteriores)
	"transferencia",            // → transferencia_ves
	"efectivo_divisa_USD",      // → efectivo_usd
	"efectivo_divisa_EUR",      // → efectivo_eur
];

// Crear una nueva orden (con transacción)
const createOrder = async (req: Request, res: Response) => {
	// Iniciamos una transacción
	const t = await sequelize.transaction();

	try {
		// Extraemos datos de la solicitud
		const { cartItems, shippingAddress, paymentMethod, deliveryType } = req.body;
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

		// Validación de tipo de entrega
		const VALID_DELIVERY_TYPES = ["delivery_moto", "pickup_tienda", "encomienda_nacional"];
		if (deliveryType && !VALID_DELIVERY_TYPES.includes(deliveryType)) {
			return res.status(400).json({
				error: "Tipo de entrega no válido",
				validTypes: VALID_DELIVERY_TYPES
			});
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

		// Verificar stock y preparar items para cálculo
		const orderItems = [];
		const itemsForTaxCalculation = [];

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

			// Preparar item para cálculo de impuestos
			itemsForTaxCalculation.push({
				productId: product.id,
				quantity: item.quantity,
				price: product.price,
				product
			});

			// Preparar item para la orden
			orderItems.push({
				productId: product.id,
				quantity: item.quantity,
				priceAtPurchase: product.price,
			});
		}

		// Calcular subtotal, impuestos y total
		const taxCalculation = await taxCalculator.calculateTaxes(itemsForTaxCalculation);

		// Determinar moneda del pago y calcular totalInVES si aplica
		const paymentCurrency = currencyService.getPaymentCurrency(paymentMethod || 'tarjeta');
		let exchangeRateAtPurchase: number | null = null;
		let totalInVES: number | null = null;

		if (paymentCurrency === 'VES') {
			// El cliente paga en bolívares: necesitamos saber la tasa activa
			// El total está en la moneda base de los productos
			// Asumimos que todos los productos tienen la misma moneda base (o tomamos la del primer producto)
			const firstProduct = products[0];
			const baseCurrency = (firstProduct as any).currency || 'USD';
			const conversion = await currencyService.convertToVES(taxCalculation.total, baseCurrency);
			if (conversion) {
				exchangeRateAtPurchase = conversion.rate;
				totalInVES = conversion.amount_ves;
			}
		}

		// Crear la orden con subtotal, impuestos y total
		const order = await Order.create(
			{
				subtotal: taxCalculation.subtotal,
				taxes_amount: taxCalculation.totalTaxAmount,
				taxes_details: taxCalculation.taxesByType, // Guardar detalle de impuestos
				total: taxCalculation.total,
				status: "pendiente por pagar",
				shippingAddress,
				userId,
				paymentMethod: paymentMethod || "tarjeta",
				paymentCurrency,
				exchangeRateAtPurchase,
				totalInVES,
				deliveryType: deliveryType || "pickup_tienda"
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

		// Registrar el estado inicial en el historial
		await registerStatusChange(
		    order.id, 
		    "pendiente por pagar", 
		    "Orden creada", 
		    req.user, 
		    t
		);

		// TODO: Si tienes un modelo Cart, aquí deberías limpiar el carrito del usuario

		// Confirmar la transacción
		await t.commit();

		// Devolver la orden creada con sus items
		const orderWithItems = await Order.findByPk(order.id, {
			include: [
				{
					model: OrderItem,
					include: [Product]
				}, 
				{ model: User, attributes: { exclude: ["password"] } },
				{ model: OrderStatusHistory, limit: 5, order: [['createdAt', 'DESC']] }
			],
			attributes: { exclude: ["userId"] },
		});

		// Convertimos a JSON para mayor seguridad si se quiere modificar
		const orderJson = orderWithItems.toJSON();

		// Si por alguna razón el password aún aparece (por ejemplo, si se usa `User.rawAttributes`)
		if (orderJson.User?.password) {
			delete orderJson.User.password;
		}

		// Incluir información de impuestos en la respuesta
		orderJson.tax_breakdown = taxCalculation.taxesByType;

		// Enviar correo de confirmación de la orden (asíncrono, no bloquea la respuesta)
		EmailNotificationService.sendOrderConfirmationEmail(orderWithItems, orderWithItems.OrderItems, req.user)
			.then(emailSent => {
				if (!emailSent) {
					logger.warn('No se pudo enviar correo de confirmación de orden', { orderId: order.id });
				}
			})
			.catch(err => {
				logger.error('Error al enviar correo de confirmación de orden', { 
					orderId: order.id, 
					error: err.message 
				});
			});

		res.status(201).json(orderJson);

	} catch (error) {
		// En caso de error, revertir la transacción
		await t.rollback();
		logger.error("Error al crear la orden", { error: error.message });

		res.status(500).json({
			error: "Error al procesar la orden",
			details: error.message,
		});
	}
};

// Obtener todas las órdenes (admin/vendor)
const getAllOrders = async (req: Request, res: Response) => {
	try {
		// Extraer posibles filtros de la consulta
		const { status, deliveryType } = req.query;
		
		// Construir condiciones de filtrado
		const whereConditions = {};
		if (status) {
			whereConditions.status = status;
		}
		if (deliveryType) {
			whereConditions.deliveryType = deliveryType;
		}
		
		const orders = await Order.findAll({
			where: whereConditions,
			include: [
				{
					model: OrderItem,
					include: [Product],
				},
				{
					model: User,
					attributes: ["id_autoincrement", "name", "email"],
				},
				{
				    model: OrderStatusHistory,
				    limit: 1,
				    order: [['createdAt', 'DESC']],
				}
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
const getOrderById = async (req: Request, res: Response) => {
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
				{
				    model: OrderStatusHistory,
				    order: [['createdAt', 'DESC']],
				}
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
const getUserOrders = async (req: Request, res: Response) => {
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
const updateOrderStatus = async (req: Request, res: Response) => {
	const t = await sequelize.transaction();

	try {
		const { id } = req.params;
		const { status, notes } = req.body;

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
		
		// Registrar el cambio en el historial
        await registerStatusChange(id, status, notes, req.user, t);

		// Confirmar transacción
		await t.commit();

		// Retornar orden actualizada
		const updatedOrder = await Order.findByPk(id, {
			include: [
			    { model: OrderItem },
			    { 
			        model: OrderStatusHistory,
			        limit: 10,
			        order: [['createdAt', 'DESC']]
			    }
			],
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
const processPayment = async (req: Request, res: Response) => {
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
				paymentDate: new Date()
			},
			{ transaction: t }
		);
		
		// Registrar el cambio en el historial
        await registerStatusChange(
            id, 
            "pagado y procesando", 
            `Pago procesado con método: ${paymentMethod}`, 
            req.user, 
            t
        );

		// Confirmar transacción
		await t.commit();

		res.json({
			message: "Pago procesado exitosamente",
			order: await Order.findByPk(id, { 
			    include: [
			        OrderItem,
			        { 
			            model: OrderStatusHistory,
			            limit: 5,
			            order: [['createdAt', 'DESC']]
			        }
			    ] 
			}),
		});
	} catch (error) {
		await t.rollback();
		console.error("Error al procesar pago:", error);
		res.status(500).json({ error: error.message });
	}
};

// Controlador para subir comprobante de pago
const uploadPaymentProof = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // Verificar que la orden existe
        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({ error: "Orden no encontrada" });
        }
        
        // Verificar que la orden pertenece al usuario actual
        if (req.user.role !== "admin" && order.userId !== req.user.id) {
            return res.status(403).json({ error: "No tienes permiso para modificar esta orden" });
        }
        
        // Verificar si hay una URL en el cuerpo (para cuando se sube a Cloudinary)
        if (!req.body.paymentProofUrl) {
            return res.status(400).json({ error: "URL del comprobante de pago no proporcionada" });
        }
        
        const transaction = await sequelize.transaction();
        
        try {
            // Extraer los campos adicionales de pago del body
            const {
                paymentProofUrl,
                paymentProofPublicId,
                payerCedula,
                payerBankAccount,
                payerPhone,
                payerName,
                payerBank,
                transactionLastDigits,
                paymentNotes
            } = req.body;
            
            // Actualizar la orden con los datos del pago
            const updateData = {
                paymentProofUrl,
                paymentProofPublicId: paymentProofPublicId || null,
                paymentDate: new Date(),
                status: order.status === 'pendiente por pagar' ? 'pagado y procesando' : order.status
            };
            
            // Añadir campos adicionales solo si vienen en la solicitud
            if (payerCedula) updateData.payerCedula = payerCedula;
            if (payerBankAccount) updateData.payerBankAccount = payerBankAccount;
            if (payerPhone) updateData.payerPhone = payerPhone;
            if (payerName) updateData.payerName = payerName;
            if (payerBank) updateData.payerBank = payerBank;
            if (transactionLastDigits) updateData.transactionLastDigits = transactionLastDigits;
            if (paymentNotes) updateData.paymentNotes = paymentNotes;
            
            await order.update(updateData, { transaction });
            
            // Construir un mensaje detallado para el historial
            let paymentDetailsMsg = 'Comprobante de pago subido por el cliente';
            
            if (payerName) paymentDetailsMsg += `, Nombre: ${payerName}`;
            if (payerBank) paymentDetailsMsg += `, Banco: ${payerBank}`;
            if (transactionLastDigits) paymentDetailsMsg += `, Últimos dígitos: ${transactionLastDigits}`;
            
            // Registrar cambio en el historial si cambió el estado
            if (order.status === 'pendiente por pagar') {
                await registerStatusChange(
                    id,
                    'pagado y procesando',
                    paymentDetailsMsg,
                    req.user,
                    transaction
                );
            }
            
            await transaction.commit();
            
            // Obtener la orden actualizada con historial
            const updatedOrder = await Order.findByPk(id, {
                include: [
                    { model: OrderItem },
                    { 
                        model: OrderStatusHistory,
                        limit: 5,
                        order: [['createdAt', 'DESC']]
                    }
                ]
            });
            
            res.status(200).json({
                message: "Comprobante de pago registrado correctamente",
                order: updatedOrder
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        logger.error('Error al registrar comprobante de pago', { error: error.message });
        res.status(500).json({ error: "Error al procesar el comprobante de pago" });
    }
};

// Obtener historial de estados de una orden
const getOrderStatusHistory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // Verificar que la orden existe
        const order = await Order.findByPk(id, {
            include: [
                {
                    model: OrderStatusHistory,
                    order: [['createdAt', 'DESC']],
                    include: [
                        {
                            model: User,
                            as: 'statusUpdater',
                            attributes: ['id', 'name', 'email', 'role']
                        }
                    ]
                }
            ]
        });
        
        if (!order) {
            return res.status(404).json({ error: "Orden no encontrada" });
        }
        
        // Verificar permisos (solo admin, vendor o el dueño de la orden)
        if (
            req.user.role !== "admin" &&
            req.user.role !== "vendor" &&
            order.userId !== req.user.id
        ) {
            return res.status(403).json({ error: "No tienes permiso para ver esta información" });
        }
        
        res.json({
            orderId: order.id,
            currentStatus: order.status,
            statusHistory: order.OrderStatusHistories
        });
    } catch (error) {
        logger.error('Error al obtener historial de estados', { error: error.message });
        res.status(500).json({ error: "Error al obtener historial de estados" });
    }
};

// Actualizar una orden (campos generales)
const updateOrder = async (req: Request, res: Response) => {
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
		
		// Registrar nota en el historial si se proporcionó
		if (req.body.notes) {
		    await registerStatusChange(
		        id,
		        order.status,
		        req.body.notes,
		        req.user
		    );
		}
		
		res.json({
			message: "Orden actualizada correctamente",
			order,
		});
	} catch (error) {
		console.error("Error al actualizar orden:", error);
		res.status(500).json({ error: error.message });
	}
};

const updatingStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    try {
        const order = await Order.findByPk(id);

        if (!order) {
            return res.status(404).json({ error: "Orden no encontrada" });
        }

        // Iniciar transacción
        const transaction = await sequelize.transaction();
        
        try {
            // Actualizar estado de la orden
            await order.update({ status }, { transaction });
            
            // Registrar en historial
            await registerStatusChange(id, status, notes, req.user, transaction);
            
            // Confirmar transacción
            await transaction.commit();
            
            // Obtener orden actualizada con historial
            const updatedOrder = await Order.findByPk(id, {
                include: [
                    { 
                        model: OrderStatusHistory,
                        limit: 5,
                        order: [['createdAt', 'DESC']]
                    }
                ]
            });
            
            res.json({
                message: `Estado de la orden actualizado a: ${status}`,
                order: updatedOrder,
            });
        } catch (error) {
            // Revertir transacción en caso de error
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        logger.error("Error al actualizar estado de orden:", { error: error.message });
        res.status(500).json({ error: error.message });
    }
};

// Eliminar una orden
const deleteOrder = async (req: Request, res: Response) => {
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

// Obtener tipos de entrega disponiblesconst getDeliveryTypes = async (req: Request, res: Response) => {
	try {
		const deliveryTypes = [
			{
				id: "delivery_moto",
				name: "Delivery con moto",
				description: "Entrega a domicilio con motodelivery local"
			},
			{
				id: "pickup_tienda",
				name: "Retiro en tienda",
				description: "El cliente retira su pedido en nuestra tienda física"
			},
			{
				id: "encomienda_nacional",
				name: "Encomienda nacional",
				description: "Envío a cualquier parte del país mediante empresa de transporte"
			}
		];

		res.json({
			success: true,
			data: deliveryTypes
		});
	} catch (error) {
		console.error("Error al obtener tipos de entrega:", error);
		res.status(500).json({ 
			success: false,
			error: error.message 
		});
	}
};

export {
	createOrder,
	getAllOrders,
	getOrderById,
	getUserOrders,
	updateOrder,
	deleteOrder,
	updateOrderStatus,
	processPayment,
    updatingStatus,
    uploadPaymentProof,
    getOrderStatusHistory,
    getDeliveryTypes
};
