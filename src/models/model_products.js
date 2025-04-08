const { DataTypes } = require("sequelize");
const sequelize = require("../configs/database");

const Product = sequelize.define("Product", {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	name: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	description: {
		type: DataTypes.TEXT,
	},
	price: {
		type: DataTypes.DECIMAL(10, 2),
		allowNull: false,
	},
	stock: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
	},
	imageUrl: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	metadata: {
		type: DataTypes.JSONB,
		allowNull: true,
	},
});

// ... definición del modelo Product ...

Product.associate = (models) => {
	// Un producto pertenece a muchas categorías (N:M)
	Product.belongsToMany(models.Category, {
		through: "ProductCategory",
		foreignKey: "productId",
	});

	// Un producto está en muchos carritos (a través de CartItem)
	Product.hasMany(models.CartItem, { foreignKey: "productId" });

	// Un producto está en muchas órdenes (a través de OrderItem)
	Product.hasMany(models.OrderItem, { foreignKey: "productId" });

	// Un producto está en favoritos de muchos usuarios (N:M)
	Product.belongsToMany(models.User, {
		through: "Favorite",
		foreignKey: "productId",
	});
};

module.exports = Product;
