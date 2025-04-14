const { DataTypes } = require("sequelize");
const sequelize = require("../configs/database");

const Order = sequelize.define("Order", {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	total: {
		type: DataTypes.DECIMAL(10, 2),
		allowNull: false,
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
});


module.exports = Order;
