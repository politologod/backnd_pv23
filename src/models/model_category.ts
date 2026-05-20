import { ICategory } from '../types/models';
import {  DataTypes  } from 'sequelize';
import sequelize from '../configs/database';

const Category = sequelize.define<ICategory>("Category", {
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
    slug: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        comment: 'URL-friendly version of the category name',
    },
    parentId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Para subcategorías
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'URL de la imagen de la categoría',
    },
    seo: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'SEO metadata { metaTitle, metaDescription }',
        defaultValue: null
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: 'Orden de visualización',
    },
    // Legacy SEO fields (kept for backward compatibility)
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
});

// No más método associate aquí - movido a associations.js

export default Category;