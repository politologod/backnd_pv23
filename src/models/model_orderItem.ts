import { IOrderItem } from '../types/models';
import {  DataTypes  } from 'sequelize';
import sequelize from '../configs/database';

const OrderItem = sequelize.define<IOrderItem>("OrderItem", {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	quantity: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	priceAtPurchase: {
		type: DataTypes.DECIMAL(10, 2),
		allowNull: false,
	},
});

export default OrderItem;