import { IOrder } from '../types/models';
import {  DataTypes  } from 'sequelize';
import sequelize from '../configs/database';

const Order = sequelize.define<IOrder>("Order", {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	subtotal: {
		type: DataTypes.DECIMAL(10, 2),
		allowNull: false,
		comment: 'Monto total de productos sin impuestos',
		defaultValue: 0.00
	},
	taxes_amount: {
		type: DataTypes.DECIMAL(10, 2),
		allowNull: false,
		defaultValue: 0.00,
		comment: 'Monto total de impuestos aplicados'
	},
	taxes_details: {
		type: DataTypes.JSON,
		allowNull: true,
		comment: 'Detalles de impuestos aplicados (JSON con desglose)'
	},
	total: {
		type: DataTypes.DECIMAL(10, 2),
		allowNull: false,
		comment: 'Monto total incluyendo impuestos'
	},
	status: {
		type: DataTypes.ENUM(
			"pendiente por pagar",
			"pagado y procesando",
			"enviado",
			"entregado",
			"cancelado"
		),
		defaultValue: "pendiente por pagar",
	},
	shippingAddress: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	deliveryType: {
		type: DataTypes.ENUM(
			"delivery_moto",
			"pickup_tienda", 
			"encomienda_nacional"
		),
		allowNull: false,
		defaultValue: "pickup_tienda",
		comment: "Tipo de entrega seleccionado por el cliente"
	},
	paymentMethod: {
		type: DataTypes.STRING,
		allowNull: false,
		defaultValue: "tarjeta",
	},
	paymentProofUrl: {
		type: DataTypes.STRING,
		allowNull: true,
		comment: "URL de la imagen del comprobante de pago en Cloudinary",
	},
	paymentProofPublicId: {
		type: DataTypes.STRING,
		allowNull: true,
		comment: "ID público de la imagen en Cloudinary para posible eliminación",
	},
	paymentDate: {
		type: DataTypes.DATE,
		allowNull: true,
		comment: "Fecha en que se registró el pago",
	},
	paymentNotes: {
		type: DataTypes.TEXT,
		allowNull: true,
		comment: "Información adicional sobre el pago (referencia, etc.)"
	},
	// Nuevos campos para información de pago
	payerCedula: {
		type: DataTypes.STRING(20),
		allowNull: true,
		comment: "Número de cédula de quien realiza el pago"
	},
	payerBankAccount: {
		type: DataTypes.STRING(30),
		allowNull: true,
		comment: "Número de cuenta bancaria si aplica"
	},
	payerPhone: {
		type: DataTypes.STRING(20),
		allowNull: true,
		comment: "Número de teléfono del pagador"
	},
	payerName: {
		type: DataTypes.STRING(100),
		allowNull: true,
		comment: "Nombre completo de quien realiza el pago"
	},
	payerBank: {
		type: DataTypes.STRING(50),
		allowNull: true,
		comment: "Banco desde el que se realiza la transferencia"
	},
	transactionLastDigits: {
		type: DataTypes.STRING(6),
		allowNull: true,
		comment: "Últimos 6 dígitos de la transacción para pagos móviles o transferencias"
	}
});


export default Order;
