// @ts-nocheck
import { IOrderItem } from '../types/models';
import {  DataTypes  } from 'sequelize';
import sequelize from '../configs/database';

const OrderItem = sequelize.define<IOrderItem>("OrderItem", {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	productName: {
		type: DataTypes.STRING,
		allowNull: true,
		comment: 'Nombre del producto al momento de la compra (snapshot)',
	},
	quantity: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	priceAtPurchase: {
		type: DataTypes.DECIMAL(10, 2),
		allowNull: false,
	},
	total: {
		type: DataTypes.DECIMAL(10, 2),
		allowNull: true,
		comment: 'Total del item (quantity * priceAtPurchase)',
	},
});

export default OrderItem;