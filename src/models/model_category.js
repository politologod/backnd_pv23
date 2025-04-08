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
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
});

// No más método associate aquí - movido a associations.js

module.exports = Category;