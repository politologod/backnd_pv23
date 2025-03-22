const Cart = sequelize.define("Cart", {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
});

// ... definición del modelo Cart ...

Cart.associate = (models) => {
	// Un carrito pertenece a un usuario
	Cart.belongsTo(models.User, { foreignKey: "userId" });

	// Un carrito tiene muchos ítems (CartItem)
	Cart.hasMany(models.CartItem, { foreignKey: "cartId" });
};

module.exports = Cart;
