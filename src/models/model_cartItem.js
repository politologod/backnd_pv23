const { DataTypes } = require("sequelize");
const sequelize = require("../configs/database");

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

// ... definición del modelo CartItem ...

CartItem.associate = (models) => {
	// Un CartItem pertenece a un carrito
	CartItem.belongsTo(models.Cart, { foreignKey: "cartId" });

	// Un CartItem pertenece a un producto
	CartItem.belongsTo(models.Product, { foreignKey: "productId" });
};

module.exports = CartItem;
