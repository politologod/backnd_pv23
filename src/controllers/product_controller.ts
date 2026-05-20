// @ts-nocheck
import Product from '../models/model_products';
import Category from '../models/model_category';
import {  Op  } from 'sequelize';
import {  validateProduct  } from '../utils/validator';
import {  ValidationError  } from '../utils/errorHandler';
import logger from '../configs/logger';
import taxCalculator from '../utils/taxCalculator';
import currencyService from '../services/currencyService';
import { Request, Response } from 'express';


// Updating a product
const updateProduct = async (req: Request, res: Response) => {
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
                console.warn('Algunas categorías no fueron encontradas', { 
                    productId: id, 
                    requestedCategories: categoryIds,
                    foundCategories: categories.map(c => (c as any).id)
                });
            }
            await (product as any).setCategories(categories);
        }
        
        console.info('Producto actualizado exitosamente', { productId: id });
        res.json(product);
    } catch (error) {
        console.error('Error al actualizar producto', (error as Error).message);
        
        if (error instanceof ValidationError) {
            return res.status(422).json({ 
                error: error.message,
                details: error.errors
            });
        }
        
        res.status(400).json({ error: (error as Error).message });
    }
};

// Creating a product
const createProduct = async (req: Request, res: Response) => {
    try {
        // Detectar si la solicitud es para un solo producto o para múltiples
        const isBatchOperation = Array.isArray(req.body);
        
        // Si es una operación por lotes
        if (isBatchOperation) {
            return await handleBatchProductCreation(req, res);
        }
        
        // Lógica para un solo producto (existente)
        const { categoryIds } = req.body;
        
        // Validar producto
        const validationResult = validateProduct(req.body);
        if (!validationResult.valid) {
            throw new ValidationError('Datos de producto inválidos', validationResult.errors);
        }
        
        // Crear el producto sin las categorías primero
        const productData = { ...req.body };
        
        // Eliminar categoryIds del objeto si existe
        if (productData.categoryIds) {
            delete productData.categoryIds;
        }
        
        // Crear el producto
        const product = await Product.create(productData);
        console.info('Producto creado', (product as any).toJSON());

        // Associate categories (N:M)
        if (Array.isArray(categoryIds) && categoryIds.length > 0) {
            try {
                const categories = await Category.findAll({ where: { id: categoryIds } });
                console.info('Categorías encontradas', categories.map(c => (c as any).id));
                
                if (categories.length !== categoryIds.length) {
                    console.warn('Algunas categorías no fueron encontradas', { 
                        productId: (product as any).id, 
                        requestedCategories: categoryIds,
                        foundCategories: categories.map(c => (c as any).id)
                    });
                }
                
                if (categories.length > 0) {
                    // Verificar que setCategories está disponible
                    if (typeof (product as any).setCategories !== 'function') {
                        console.error('La función setCategories no está disponible en el producto', {
                            productMethods: Object.keys((product as any).__proto__),
                            hasAssociations: !!Product.associations,
                            associationsKeys: Product.associations ? Object.keys(Product.associations) : []
                        });
                    } else {
                        await (product as any).setCategories(categories);
                        console.info('Categorías asociadas correctamente');
                    }
                }
            } catch (categoryError) {
                console.error('Error al asociar categorías', categoryError);
                // No fallamos toda la creación por un error en las categorías
            }
        }

        console.info('Nuevo producto creado', { productId: (product as any).id, name: (product as any).name });
        res.status(201).json(product);
    } catch (error) {
        console.error('Error al crear producto completo:', error);
        
        // Verificar si es un error de validación de Sequelize
        if ((error as any).name === 'SequelizeValidationError' || (error as any).name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ 
                error: 'Error de validación en Sequelize', 
                details: (error as any).errors.map((e: any) => ({ 
                    message: e.message, 
                    field: e.path,
                    type: e.type
                }))
            });
        }
        
        if (error instanceof ValidationError) {
            return res.status(422).json({ 
                error: error.message,
                details: error.errors
            });
        }
        
        res.status(400).json({ error: (error as Error).message });
    }
};

/**
 * Maneja la creación de múltiples productos en una sola operación
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const handleBatchProductCreation = async (req: Request, res: Response) => {
    const products = req.body;
    const results = {
        success: [],
        errors: []
    };

    // Validar que sea un array no vacío
    if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ 
            error: "El formato para creación por lotes debe ser un array no vacío de productos" 
        });
    }

    // Limitar la cantidad de productos por operación
    const MAX_BATCH_SIZE = 50;
    if (products.length > MAX_BATCH_SIZE) {
        return res.status(400).json({ 
            error: `Demasiados productos en una sola operación. Máximo permitido: ${MAX_BATCH_SIZE}` 
        });
    }

    console.info(`Iniciando creación por lotes de ${products.length} productos`);

    // Procesar cada producto
    for (let i = 0; i < products.length; i++) {
        const productData = products[i];
        
        try {
            // Validar producto
            const validationResult = validateProduct(productData);
            if (!validationResult.valid) {
                throw new ValidationError('Datos de producto inválidos', validationResult.errors);
            }

            // Extraer categoryIds y crear el producto
            const { categoryIds, ...productDetails } = productData;
            
            // Crear el producto
            const product = await Product.create(productDetails);
            
            // Asociar categorías si existen
            if (Array.isArray(categoryIds) && categoryIds.length > 0) {
                try {
                    const categories = await Category.findAll({ 
                        where: { id: categoryIds } 
                    });
                    
                    if (categories.length > 0) {
                        await (product as any).setCategories(categories);
                    }
                } catch (categoryError) {
                    console.warn(`Error al asociar categorías para producto ${i}`, (categoryError as Error).message);
                    // No fallamos la creación por un error en las categorías
                }
            }
            
            // Añadir a resultados exitosos
            results.success.push({
                index: i,
                id: (product as any).id,
                name: (product as any).name,
                sku: (product as any).sku
            });
            
            console.info(`Producto ${i+1}/${products.length} creado con éxito`, { 
                id: (product as any).id, 
                name: (product as any).name 
            });
            
        } catch (error) {
            console.error(`Error al crear producto ${i+1}/${products.length}:`, error);
            
            // Determinar el tipo de error y estructurar la respuesta
            let errorDetails;
            
            if ((error as any).name === 'SequelizeValidationError' || (error as any).name === 'SequelizeUniqueConstraintError') {
                errorDetails = {
                    type: 'validation',
                    details: (error as any).errors.map((e: any) => ({ 
                        message: e.message, 
                        field: e.path,
                        type: e.type
                    }))
                };
            } else if (error instanceof ValidationError) {
                errorDetails = {
                    type: 'validation',
                    details: error.errors
                };
            } else {
                errorDetails = {
                    type: 'general',
                    message: (error as Error).message
                };
            }
            
            // Añadir a errores
            results.errors.push({
                index: i,
                name: productData.name || 'Desconocido',
                sku: productData.sku || 'N/A',
                error: errorDetails
            });
        }
    }
    
    // Enviar respuesta con resultados
    const totalSuccess = results.success.length;
    const totalErrors = results.errors.length;
    
    console.info(`Creación por lotes completada. Éxitos: ${totalSuccess}, Errores: ${totalErrors}`);
    
    res.status(207).json({
        message: `Creación por lotes completada. ${totalSuccess} productos creados con éxito, ${totalErrors} errores.`,
        success: results.success,
        errors: results.errors,
        stats: {
            total: products.length,
            successful: totalSuccess,
            failed: totalErrors
        }
    });
};

// Getting all products with pagination added
const getAllProducts = async (req: Request, res: Response) => {
    try {
        // Extract pagination parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        // Validar que page y limit sean valores válidos
        if (page < 1 || limit < 1 || limit > 100) {
            return res.status(400).json({ 
                error: "Parámetros de paginación inválidos",
                details: "page debe ser >= 1 y limit debe estar entre 1 y 100"
            });
        }

        const result = await Product.findAndCountAll({
            limit,
            offset,
            include: Category,
        });

        // Enriquecer productos con precio en VES (una sola consulta de tasa)
        const enrichedProducts = await Promise.all(
            result.rows.map(async (product) => {
                const productJson = product.toJSON() as any;
                const vesConversion = await currencyService.convertToVES(
                    parseFloat(productJson.price),
                    productJson.currency || 'USD'
                );
                if (vesConversion) {
                    productJson.price_ves = vesConversion.amount_ves;
                    productJson.exchange_rate_ves = vesConversion.rate;
                }
                return productJson;
            })
        );

        res.status(200).json({
            message: "Lista de productos obtenida exitosamente",
            products: enrichedProducts,
            pagination: {
                page,
                limit,
                offset,
                totalItems: result.count,
                totalPages: Math.ceil(result.count / limit)
            }
        });
    } catch (error) {
        console.error('Error al obtener lista de productos', (error as Error).message);
        res.status(500).json({ error: "Error al obtener productos" });
    }
};

const getProductById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // Validar que el ID sea un número válido
        if (isNaN(id as any)) {
            return res.status(400).json({ error: "ID de producto inválido" });
        }
        
        const product = await Product.findByPk(id, { include: Category });
        if (!product) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        // Enriquecer con precio en VES si la tasa está activa
        const productJson = product.toJSON() as any;
        const vesConversion = await currencyService.convertToVES(
            parseFloat(productJson.price),
            productJson.currency || 'USD'
        );
        if (vesConversion) {
            productJson.price_ves = vesConversion.amount_ves;
            productJson.exchange_rate_ves = vesConversion.rate;
            productJson.exchange_rate_source = vesConversion.source;
        }

        res.json(productJson);
    } catch (error) {
        console.error('Error al obtener producto por ID', (error as Error).message);
        res.status(400).json({ error: (error as Error).message });
    }
};

const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // Validar que el ID sea un número válido
        if (isNaN(id as any)) {
            return res.status(400).json({ error: "ID de producto inválido" });
        }
        
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        await product.destroy();
        
        console.info('Producto eliminado exitosamente', { productId: id });
        res.json({ message: "Producto eliminado con éxito" });
    } catch (error) {
        console.error('Error al eliminar producto', (error as Error).message);
        res.status(400).json({ error: (error as Error).message });
    }
};

const getProductByCategory = async (req: Request, res: Response) => {
    try {
        const { categoryId } = req.params;
        
        // Validar que el ID de categoría sea un número válido
        if (isNaN(categoryId as any)) {
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
        res.json((category as any).Products);
    } catch (error) {
        console.error('Error al obtener productos por categoría', (error as Error).message);
        res.status(400).json({ error: (error as Error).message });
    }
};

const getProductByNames = async (req: Request, res: Response) => {
    try {
        const { name } = req.query;
        
        // Validar que el nombre tenga al menos 2 caracteres
        if (!name || (name as string).trim().length < 2) {
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
        console.error('Error al buscar productos por nombre', (error as Error).message);
        res.status(400).json({ error: (error as Error).message });
    }
};

const getProductByPrice = async (req: Request, res: Response) => {
    try {
        const { min, max } = req.query;
        
        // Validar rango de precios
        const minPrice = parseFloat(min as string);
        const maxPrice = parseFloat(max as string);
        
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
        console.error('Error al buscar productos por precio', (error as Error).message);
        res.status(400).json({ error: (error as Error).message });
    }
};

const getProductWithTaxes = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // Validar que el ID sea un número válido
        if (isNaN(id as any)) {
            return res.status(400).json({ error: "ID de producto inválido" });
        }
        
        // Buscar el producto
        const product = await Product.findByPk(id, { include: Category });
        if (!product) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        
        // Calcular impuestos para el producto

        
        const itemWithTaxes = await taxCalculator.calculateItemTaxes({
            productId: (product as any).id,
            quantity: 1,
            price: (product as any).price,
            product
        });
        
        res.status(200).json({
            success: true,
            data: {
                product: {
                    id: (product as any).id,
                    name: (product as any).name,
                    description: (product as any).description,
                    price: (product as any).price,
                    sku: (product as any).sku,
                    barcode: (product as any).barcode,
                    compareAtPrice: (product as any).compareAtPrice,
                    cost: (product as any).cost,
                    status: (product as any).status,
                    categories: (product as any).Categories || [],
                    images: (product as any).images || [],
                    stock: (product as any).stock,
                    weight: (product as any).weight,
                    dimensions: (product as any).dimensions,
                    seo: (product as any).seo,
                    tags: (product as any).tags
                },
                priceWithoutTax: (product as any).price,
                taxes: itemWithTaxes.taxDetails,
                totalTaxAmount: itemWithTaxes.totalTaxAmount,
                priceWithTax: itemWithTaxes.total
            }
        });
    } catch (error) {
        console.error('Error al obtener producto con impuestos', (error as Error).message);
        res.status(500).json({ 
            success: false, 
            error: "Error al obtener producto con impuestos",
            details: (error as Error).message 
        });
    }
};

export { 
    createProduct, 
    getAllProducts, 
    getProductById, 
    updateProduct, 
    deleteProduct, 
    getProductByCategory, 
    getProductByNames, 
    getProductByPrice,
    getProductWithTaxes
};