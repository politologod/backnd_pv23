import {  DataTypes  } from 'sequelize';
import sequelize from '../configs/database';

const CartItem = sequelize.define("CartItem", {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	quantity: {
		type: DataTypes.INTEGER,
		defaultValue: 1,
	},
});


export default CartItem;
