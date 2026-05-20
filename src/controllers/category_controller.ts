// @ts-nocheck
import Category from '../models/model_category'; 
import {  validateCategory  } from '../utils/validator';
import {  ValidationError  } from '../utils/errorHandler';
import logger from '../configs/logger';
import { Request, Response } from 'express';


// Obtener todas las categorías
const getAllCategories = async (req: Request, res: Response) => {
    try {
        const categories = await Category.findAll({
            include: [{ model: Category, as: 'children' }],
            order: [['sortOrder', 'ASC'], ['name', 'ASC']]
        });
        res.status(200).json(categories);
    } catch (error) {
        console.error('Error al obtener todas las categorías', (error as Error).message);
        res.status(500).json({ message: 'Error al obtener las categorías', error: (error as Error).message });
    }
};

// Obtener una categoría por ID
const getCategoryById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // Validar que el ID sea un número válido
        if (isNaN(id as any)) {
            return res.status(400).json({ message: 'ID de categoría inválido' });
        }
        
        const category = await Category.findByPk(id, {
            include: [
                { model: Category, as: 'children' },
                { model: Category, as: 'parent' }
            ]
        });
        if (!category) {
            console.warn('Categoría no encontrada', { categoryId: id });
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }
        
        res.status(200).json(category);
    } catch (error) {
        console.error('Error al obtener categoría por ID', (error as Error).message);
        res.status(500).json({ message: 'Error al obtener la categoría', error: (error as Error).message });
    }
};

// Crear una nueva categoría
const createCategory = async (req: Request, res: Response) => {
    try {
        const { name, description, slug, image, seo, active, sortOrder, parentId } = req.body;
        
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
        
        // Auto-generar slug a partir del nombre si no se proporciona
        const categorySlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        
        const newCategory = new Category({ name, description, slug: categorySlug, image, seo, active, sortOrder, parentId });
        await newCategory.save();
        
        console.info('Nueva categoría creada', { categoryId: newCategory.id, name });
        res.status(201).json(newCategory);
    } catch (error) {
        console.error('Error al crear categoría', (error as Error).message);
        
        if (error instanceof ValidationError) {
            return res.status(422).json({ 
                message: error.message,
                details: error.errors
            });
        }
        
        res.status(500).json({ message: 'Error al crear la categoría', error: (error as Error).message });
    }
};

// Actualizar una categoría por ID
const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, slug, image, seo, active, sortOrder, parentId } = req.body;
        
        // Validar que el ID sea un número válido
        if (isNaN(id as any)) {
            return res.status(400).json({ message: 'ID de categoría inválido' });
        }
        
        // Validar datos de la categoría
        const validationResult = validateCategory(req.body);
        if (!validationResult.valid) {
            throw new ValidationError('Datos de categoría inválidos', validationResult.errors);
        }
        
        const category = await Category.findByPk(id);
        if (!category) {
            console.warn('Categoría no encontrada para actualizar', { categoryId: id });
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }
        
        // Verificar si ya existe otra categoría con el mismo nombre
        if (name && name !== (category as any).name) {
            const existingCategory = await Category.findOne({ where: { name } });
            if (existingCategory && (existingCategory as any).id !== parseInt(id)) {
                return res.status(409).json({ message: 'Ya existe otra categoría con ese nombre' });
            }
        }
        
        // Auto-generar slug si el nombre cambió y no se proporcionó slug
        const finalSlug = slug || (name && name !== (category as any).name
            ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            : (category as any).slug);
        
        await category.update({ name, description, slug: finalSlug, image, seo, active, sortOrder, parentId });
        
        console.info('Categoría actualizada', { categoryId: id });
        res.status(200).json(category);
    } catch (error) {
        console.error('Error al actualizar categoría', (error as Error).message);
        
        if (error instanceof ValidationError) {
            return res.status(422).json({ 
                message: error.message,
                details: error.errors
            });
        }
        
        res.status(500).json({ message: 'Error al actualizar la categoría', error: (error as Error).message });
    }
};

// Eliminar una categoría por ID
const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // Validar que el ID sea un número válido
        if (isNaN(id as any)) {
            return res.status(400).json({ message: 'ID de categoría inválido' });
        }
        
        const deletedCategory = await Category.findByPk(id);
        if (!deletedCategory) {
            console.warn('Categoría no encontrada para eliminar', { categoryId: id });
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }
        
        // Verificar si hay productos asociados antes de eliminar
        const productsCount = await (deletedCategory as any).countProducts();
        if (productsCount > 0) {
            console.warn('Intento de eliminar categoría con productos asociados', { 
                categoryId: id, 
                productsCount 
            });
            return res.status(400).json({ 
                message: 'No se puede eliminar la categoría porque tiene productos asociados',
                productsCount
            });
        }
        
        await deletedCategory.destroy();
        
        console.info('Categoría eliminada', { categoryId: id, name: (deletedCategory as any).name });
        res.status(200).json({ message: 'Categoría eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar categoría', (error as Error).message);
        res.status(500).json({ message: 'Error al eliminar la categoría', error: (error as Error).message });
    }
};

export {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
};