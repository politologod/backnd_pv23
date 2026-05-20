import { IProduct } from '../types/models';
import { DataTypes, Op } from 'sequelize';
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
        defaultValue: null
    },
    barcode: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Código de barras del producto',
        defaultValue: null
    },
    description: {
        type: DataTypes.TEXT,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    compareAtPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Precio de comparación (precio antes del descuento)',
        defaultValue: null
    },
    cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Costo del producto (para cálculo de márgenes)',
        defaultValue: null
    },
    currency: {
        type: DataTypes.ENUM('USD', 'EUR'),
        allowNull: false,
        defaultValue: 'USD',
        comment: 'Moneda en que está expresado el precio del producto',
    },
    stock: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    status: {
        type: DataTypes.ENUM('active', 'draft', 'archived'),
        allowNull: false,
        defaultValue: 'active',
        comment: 'Estado del producto en el catálogo',
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    images: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
        comment: 'Array de URLs de imágenes del producto',
    },
    weight: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Peso del producto en kg',
        defaultValue: null
    },
    dimensions: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Dimensiones del producto { length, width, height } en cm',
        defaultValue: null
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    seo: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'SEO metadata { metaTitle, metaDescription, keywords }',
        defaultValue: null
    },
    tags: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Array de tags/etiquetas del producto',
        defaultValue: []
    },
    // Legacy SEO fields (kept for backward compatibility, will be migrated to seo JSONB)
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