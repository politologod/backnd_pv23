import { IProduct } from '../types/models';
import {  DataTypes, Op  } from 'sequelize';
import sequelize from '../configs/database';

const Product = sequelize.define<IProduct>("Product", {
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
        comment: 'Código único de producto (Stock Keeping Unit)',
        unique: true,
        defaultValue: null
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
    metaTitle: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    metaDescription: {
        type: DataTypes.STRING(320),
        allowNull: true
    },
    seoKeywords: {
        type: DataTypes.STRING(250),
        allowNull: true
    }
}, {
    indexes: [
        {
            unique: true,
            fields: ['sku'],
            name: 'product_sku_unique',
            where: {
                sku: {
                    [Op.ne]: null
                }
            }
        }
    ]
});

// No más método associate aquí - movido a associations.js

export default Product;