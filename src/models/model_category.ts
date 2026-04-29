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
    parentId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Para subcategorías
    },
    description: {
        type: DataTypes.TEXT,
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
});

// No más método associate aquí - movido a associations.js

export default Category;