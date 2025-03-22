const ProductCategory = sequelize.define("ProductCategory", {
	productId: {
		type: DataTypes.INTEGER,
		primaryKey: true,
	},
	categoryId: {
		type: DataTypes.INTEGER,
		primaryKey: true,
	},
});
