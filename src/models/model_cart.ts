// @ts-nocheck
import { ICart } from '../types/models';
import {  DataTypes  } from 'sequelize';
import sequelize from '../configs/database';

const Cart = sequelize.define<ICart>("Cart", {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	UserIdAutoincrement: {
		type: DataTypes.INTEGER,
		allowNull: false,
		references: {
			model: 'Users',
			key: 'id_autoincrement'
		}
	}
});

export default Cart;
