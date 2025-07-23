const { DataTypes } = require("sequelize");
const sequelize = require("../configs/database");

const Cart = sequelize.define("Cart", {
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
			key: 'id'
		}
	}
});

module.exports = Cart;
