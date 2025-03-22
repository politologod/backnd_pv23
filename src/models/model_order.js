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
			"pendiente",
			"procesando",
			"enviado",
			"entregado",
			"cancelado"
		),
		defaultValue: "pendiente",
	},
	shippingAddress: {
		type: DataTypes.STRING,
		allowNull: false,
	},
});

// ... definición del modelo Order ...

Order.associate = (models) => {
	// Una orden pertenece a un usuario
	Order.belongsTo(models.User, { foreignKey: "userId" });

	// Una orden tiene muchos ítems (OrderItem)
	Order.hasMany(models.OrderItem, { foreignKey: "orderId" });
};

module.exports = Order;
