const Product = require("../models/model_products");
const Category = require("../models/model_category");
const { Op } = require('sequelize');
const { validateProduct } = require('../utils/validator');
const { ValidationError } = require('../utils/errorHandler');
const logger = require('../configs/logger');

// Updating a product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { categoryIds } = req.body;

        // Validar producto
        const validationResult = validateProduct(req.body);
        if (!validationResult.valid) {
            throw new ValidationError('Datos de producto inválidos', validationResult.errors);
        }

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        await product.update(req.body);

        if (Array.isArray(categoryIds) && categoryIds.length > 0) {
            const categories = await Category.findAll({ where: { id: categoryIds } });
            if (categories.length !== categoryIds.length) {
                logger.warn('Algunas categorías no fueron encontradas', { 
                    productId: id, 
                    requestedCategories: categoryIds,
                    foundCategories: categories.map(c => c.id)
                });
            }
            await product.setCategories(categories);
        }
        
        logger.info('Producto actualizado exitosamente', { productId: id });
        res.json(product);
    } catch (error) {
        logger.error('Error al actualizar producto', { error: error.message, productId: req.params.id });
        
        if (error instanceof ValidationError) {
            return res.status(422).json({ 
                error: error.message,
                details: error.errors
            });
        }
        
        res.status(400).json({ error: error.message });
    }
};

// Creating a product
const createProduct = async (req, res) => {
    try {
        const { categoryIds } = req.body;
        
        // Validar producto
        const validationResult = validateProduct(req.body);
        if (!validationResult.valid) {
            throw new ValidationError('Datos de producto inválidos', validationResult.errors);
        }
        
        const product = await Product.create(req.body);

        // Associate categories (N:M)
        if (Array.isArray(categoryIds) && categoryIds.length > 0) {
            const categories = await Category.findAll({ where: { id: categoryIds } });
            if (categories.length !== categoryIds.length) {
                logger.warn('Algunas categorías no fueron encontradas', { 
                    productId: product.id, 
                    requestedCategories: categoryIds,
                    foundCategories: categories.map(c => c.id)
                });
            }
            await product.setCategories(categories);
        }

        logger.info('Nuevo producto creado', { productId: product.id, name: product.name });
        res.status(201).json(product);
    } catch (error) {
        logger.error('Error al crear producto', { error: error.message });
        
        if (error instanceof ValidationError) {
            return res.status(422).json({ 
                error: error.message,
                details: error.errors
            });
        }
        
        res.status(400).json({ error: error.message });
    }
};

// Getting all products with pagination added
const getAllProducts = async (req, res) => {
    try {
        // Extract pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Validar que page y limit sean valores válidos
        if (page < 1 || limit < 1 || limit > 100) {
            return res.status(400).json({ 
                error: "Parámetros de paginación inválidos",
                details: "page debe ser >= 1 y limit debe estar entre 1 y 100"
            });
        }

        const products = await Product.findAndCountAll({
            limit,
            offset,
            include: Category,
        });

        res.status(200).json({
            message: "Lista de productos obtenida exitosamente",
            products: products.rows,
            pagination: {
                page,
                limit,
                offset,
                totalItems: products.count,
                totalPages: Math.ceil(products.count / limit)
            }
        });
    } catch (error) {
        logger.error('Error al obtener lista de productos', { error: error.message });
        res.status(500).json({ error: "Error al obtener productos" });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validar que el ID sea un número válido
        if (isNaN(id)) {
            return res.status(400).json({ error: "ID de producto inválido" });
        }
        
        const product = await Product.findByPk(id, { include: Category });
        if (!product) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        res.json(product);
    } catch (error) {
        logger.error('Error al obtener producto por ID', { error: error.message, productId: req.params.id });
        res.status(400).json({ error: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validar que el ID sea un número válido
        if (isNaN(id)) {
            return res.status(400).json({ error: "ID de producto inválido" });
        }
        
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        await product.destroy();
        
        logger.info('Producto eliminado exitosamente', { productId: id });
        res.json({ message: "Producto eliminado con éxito" });
    } catch (error) {
        logger.error('Error al eliminar producto', { error: error.message, productId: req.params.id });
        res.status(400).json({ error: error.message });
    }
};

const getProductByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        
        // Validar que el ID de categoría sea un número válido
        if (isNaN(categoryId)) {
            return res.status(400).json({ error: "ID de categoría inválido" });
        }

        // Find category
        const category = await Category.findByPk(categoryId, {
            include: [Product]
        });

        if (!category) {
            return res.status(404).json({ error: "Categoría no encontrada" });
        }

        // Return associated products
        res.json(category.Products);
    } catch (error) {
        logger.error('Error al obtener productos por categoría', { 
            error: error.message, 
            categoryId: req.params.categoryId 
        });
        res.status(400).json({ error: error.message });
    }
};

const getProductByNames = async (req, res) => {
    try {
        const { name } = req.query;
        
        // Validar que el nombre tenga al menos 2 caracteres
        if (!name || name.trim().length < 2) {
            return res.status(400).json({ 
                error: "Nombre de producto inválido",
                details: "El término de búsqueda debe tener al menos 2 caracteres"
            });
        }
        
        const products = await Product.findAll({
            include: Category,
            where: { name: { [Op.iLike]: `%${name}%` } },
        });
        res.json(products);
    } catch (error) {
        logger.error('Error al buscar productos por nombre', { error: error.message, name: req.query.name });
        res.status(400).json({ error: error.message });
    }
};

const getProductByPrice = async (req, res) => {
    try {
        const { min, max } = req.query;
        
        // Validar rango de precios
        const minPrice = parseFloat(min);
        const maxPrice = parseFloat(max);
        
        if (isNaN(minPrice) || isNaN(maxPrice)) {
            return res.status(400).json({ 
                error: "Rango de precios inválido",
                details: "min y max deben ser números válidos"
            });
        }
        
        if (minPrice < 0 || maxPrice < 0 || minPrice > maxPrice) {
            return res.status(400).json({ 
                error: "Rango de precios inválido",
                details: "min debe ser >= 0 y max debe ser >= min"
            });
        }
        
        const products = await Product.findAll({
            include: Category,
            where: { price: { [Op.between]: [minPrice, maxPrice] } },
        });
        res.json(products);
    } catch (error) {
        logger.error('Error al buscar productos por precio', { 
            error: error.message, 
            min: req.query.min, 
            max: req.query.max 
        });
        res.status(400).json({ error: error.message });
    }
};

module.exports = { 
    createProduct, 
    getAllProducts, 
    getProductById, 
    updateProduct, 
    deleteProduct, 
    getProductByCategory, 
    getProductByNames, 
    getProductByPrice 
};