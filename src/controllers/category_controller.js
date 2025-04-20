const Category = require('../models/model_category'); 
const { validateCategory } = require('../utils/validator');
const { ValidationError } = require('../utils/errorHandler');
const logger = require('../configs/logger');

// Obtener todas las categorías
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.status(200).json(categories);
    } catch (error) {
        logger.error('Error al obtener todas las categorías', { error: error.message });
        res.status(500).json({ message: 'Error al obtener las categorías', error: error.message });
    }
};

// Obtener una categoría por ID
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validar que el ID sea un número válido
        if (isNaN(id)) {
            return res.status(400).json({ message: 'ID de categoría inválido' });
        }
        
        const category = await Category.findByPk(id);
        if (!category) {
            logger.warn('Categoría no encontrada', { categoryId: id });
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }
        
        res.status(200).json(category);
    } catch (error) {
        logger.error('Error al obtener categoría por ID', { error: error.message, categoryId: req.params.id });
        res.status(500).json({ message: 'Error al obtener la categoría', error: error.message });
    }
};

// Crear una nueva categoría
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        
        // Validar datos de la categoría
        const validationResult = validateCategory(req.body);
        if (!validationResult.valid) {
            throw new ValidationError('Datos de categoría inválidos', validationResult.errors);
        }
        
        // Verificar si ya existe una categoría con el mismo nombre
        const existingCategory = await Category.findOne({ where: { name } });
        if (existingCategory) {
            return res.status(409).json({ message: 'Ya existe una categoría con ese nombre' });
        }
        
        const newCategory = new Category({ name, description });
        await newCategory.save();
        
        logger.info('Nueva categoría creada', { categoryId: newCategory.id, name });
        res.status(201).json(newCategory);
    } catch (error) {
        logger.error('Error al crear categoría', { error: error.message });
        
        if (error instanceof ValidationError) {
            return res.status(422).json({ 
                message: error.message,
                details: error.errors
            });
        }
        
        res.status(500).json({ message: 'Error al crear la categoría', error: error.message });
    }
};

// Actualizar una categoría por ID
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        
        // Validar que el ID sea un número válido
        if (isNaN(id)) {
            return res.status(400).json({ message: 'ID de categoría inválido' });
        }
        
        // Validar datos de la categoría
        const validationResult = validateCategory(req.body);
        if (!validationResult.valid) {
            throw new ValidationError('Datos de categoría inválidos', validationResult.errors);
        }
        
        const category = await Category.findByPk(id);
        if (!category) {
            logger.warn('Categoría no encontrada para actualizar', { categoryId: id });
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }
        
        // Verificar si ya existe otra categoría con el mismo nombre
        if (name && name !== category.name) {
            const existingCategory = await Category.findOne({ where: { name } });
            if (existingCategory && existingCategory.id !== parseInt(id)) {
                return res.status(409).json({ message: 'Ya existe otra categoría con ese nombre' });
            }
        }
        
        category.name = name;
        category.description = description;
        await category.save();
        
        logger.info('Categoría actualizada', { categoryId: id });
        res.status(200).json(category);
    } catch (error) {
        logger.error('Error al actualizar categoría', { error: error.message, categoryId: req.params.id });
        
        if (error instanceof ValidationError) {
            return res.status(422).json({ 
                message: error.message,
                details: error.errors
            });
        }
        
        res.status(500).json({ message: 'Error al actualizar la categoría', error: error.message });
    }
};

// Eliminar una categoría por ID
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validar que el ID sea un número válido
        if (isNaN(id)) {
            return res.status(400).json({ message: 'ID de categoría inválido' });
        }
        
        const deletedCategory = await Category.findByPk(id);
        if (!deletedCategory) {
            logger.warn('Categoría no encontrada para eliminar', { categoryId: id });
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }
        
        // Verificar si hay productos asociados antes de eliminar
        const productsCount = await deletedCategory.countProducts();
        if (productsCount > 0) {
            logger.warn('Intento de eliminar categoría con productos asociados', { 
                categoryId: id, 
                productsCount 
            });
            return res.status(400).json({ 
                message: 'No se puede eliminar la categoría porque tiene productos asociados',
                productsCount
            });
        }
        
        await deletedCategory.destroy();
        
        logger.info('Categoría eliminada', { categoryId: id, name: deletedCategory.name });
        res.status(200).json({ message: 'Categoría eliminada correctamente' });
    } catch (error) {
        logger.error('Error al eliminar categoría', { error: error.message, categoryId: req.params.id });
        res.status(500).json({ message: 'Error al eliminar la categoría', error: error.message });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
};