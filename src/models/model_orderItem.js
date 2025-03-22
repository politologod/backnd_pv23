const OrderItem = sequelize.define("OrderItem", {
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
