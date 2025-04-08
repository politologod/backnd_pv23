const { DataTypes } = require("sequelize");
const sequelize = require("../configs/database");

const Category = sequelize.define("Category", {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	name: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true,
	},
	parentId: {
		type: DataTypes.INTEGER,
		allowNull: true, // Para subcategorías
	},
});

// ... definición del modelo Category ...

Category.associate = (models) => {
	// Una categoría puede tener subcategorías (auto-relación)
	Category.hasMany(models.Category, {
		foreignKey: "parentId",
		as: "subcategories",
	});

	// Una categoría pertenece a muchas productos (N:M)
	Category.belongsToMany(models.Product, {
		through: "ProductCategory",
		foreignKey: "categoryId",
	});
};

module.exports = Category;
