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
    sku: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Código único de producto (Stock Keeping Unit)'
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
}, {
    indexes: [
        {
            unique: true,
            fields: ['sku'],
            name: 'product_sku_unique'
        }
    ]
});

// No más método associate aquí - movido a associations.js

module.exports = Product;