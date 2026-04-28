import {  Tax, ProductTax, Product  } from '../models';
import sequelize from '../configs/database';
import logger from '../configs/logger';
import {  validateString, validateNumber  } from '../utils/validator';
import taxCalculator from '../utils/taxCalculator';

/**
 * Obtener todos los impuestos
 */
const getAllTaxes = async (req, res) => {
  try {
    // Filtros opcionales
    const { active, country, region } = req.query;
    const whereClause = {};
    
    // Aplicar filtros si se proporcionan
    if (active !== undefined) {
      whereClause.active = active === 'true';
    }
    
    if (country) {
      whereClause.country = country;
    }
    
    if (region) {
      whereClause.region = region;
    }
    
    const taxes = await Tax.findAll({
      where: whereClause,
      order: [['name', 'ASC']],
      include: [
        { 
          model: Product,
          through: { attributes: ['is_exempt', 'custom_rate'] },
          attributes: ['id', 'name'],
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      data: taxes
    });
  } catch (error) {
    logger.error('Error al obtener impuestos', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error al obtener impuestos',
      details: error.message
    });
  }
};

/**
 * Obtener un impuesto por ID
 */
const getTaxById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tax = await Tax.findByPk(id, {
      include: [
        { 
          model: Product,
          through: { attributes: ['is_exempt', 'custom_rate'] },
          attributes: ['id', 'name'],
        }
      ]
    });
    
    if (!tax) {
      return res.status(404).json({
        success: false,
        error: 'Impuesto no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: tax
    });
  } catch (error) {
    logger.error(`Error al obtener impuesto ID ${req.params.id}`, { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error al obtener el impuesto',
      details: error.message
    });
  }
};

/**
 * Crear un nuevo impuesto
 */
const createTax = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { 
      name, code, description, rate, 
      is_percentage = true, applies_to_all = true,
      country, region, active = true 
    } = req.body;
    
    // Validaciones
    const errors = {};
    
    const nameValidation = validateString(name, { min: 2, max: 50, required: true });
    if (!nameValidation.valid) errors.name = nameValidation.message;
    
    const codeValidation = validateString(code, { min: 2, max: 20, required: true });
    if (!codeValidation.valid) errors.code = codeValidation.message;
    
    const rateValidation = validateNumber(rate, { min: 0, required: true });
    if (!rateValidation.valid) errors.rate = rateValidation.message;
    
    // Si hay errores, retornar
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    
    // Verificar si ya existe un impuesto con el mismo código
    const existingTax = await Tax.findOne({ where: { code } });
    if (existingTax) {
      return res.status(400).json({
        success: false,
        error: `Ya existe un impuesto con el código ${code}`
      });
    }
    
    // Crear el impuesto
    const newTax = await Tax.create({
      name,
      code,
      description,
      rate,
      is_percentage,
      applies_to_all,
      country,
      region,
      active,
      created_by: req.user?.id,
      updated_by: req.user?.id
    }, { transaction });
    
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      message: 'Impuesto creado exitosamente',
      data: newTax
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error al crear impuesto', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error al crear el impuesto',
      details: error.message
    });
  }
};

/**
 * Actualizar un impuesto existente
 */
const updateTax = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { 
      name, description, rate, 
      is_percentage, applies_to_all,
      country, region, active 
    } = req.body;
    
    // Verificar si el impuesto existe
    const tax = await Tax.findByPk(id);
    if (!tax) {
      return res.status(404).json({
        success: false,
        error: 'Impuesto no encontrado'
      });
    }
    
    // Validaciones para campos que se pueden actualizar
    const updates = {};
    const errors = {};
    
    if (name !== undefined) {
      const nameValidation = validateString(name, { min: 2, max: 50, required: true });
      if (!nameValidation.valid) errors.name = nameValidation.message;
      else updates.name = name;
    }
    
    if (rate !== undefined) {
      const rateValidation = validateNumber(rate, { min: 0, required: true });
      if (!rateValidation.valid) errors.rate = rateValidation.message;
      else updates.rate = rate;
    }
    
    // Campos opcionales
    if (description !== undefined) updates.description = description;
    if (is_percentage !== undefined) updates.is_percentage = is_percentage;
    if (applies_to_all !== undefined) updates.applies_to_all = applies_to_all;
    if (country !== undefined) updates.country = country;
    if (region !== undefined) updates.region = region;
    if (active !== undefined) updates.active = active;
    
    // Agregar quién actualizó
    updates.updated_by = req.user?.id;
    
    // Si hay errores, retornar
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    
    // Actualizar el impuesto
    await tax.update(updates, { transaction });
    
    await transaction.commit();
    
    // Obtener el impuesto actualizado
    const updatedTax = await Tax.findByPk(id);
    
    res.status(200).json({
      success: true,
      message: 'Impuesto actualizado exitosamente',
      data: updatedTax
    });
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error al actualizar impuesto ID ${req.params.id}`, { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el impuesto',
      details: error.message
    });
  }
};

/**
 * Eliminar un impuesto
 */
const deleteTax = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // Verificar si el impuesto existe
    const tax = await Tax.findByPk(id);
    if (!tax) {
      return res.status(404).json({
        success: false,
        error: 'Impuesto no encontrado'
      });
    }
    
    // Eliminar asociaciones con productos
    await ProductTax.destroy({
      where: { tax_id: id },
      transaction
    });
    
    // Eliminar el impuesto
    await tax.destroy({ transaction });
    
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      message: 'Impuesto eliminado exitosamente'
    });
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error al eliminar impuesto ID ${req.params.id}`, { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error al eliminar el impuesto',
      details: error.message
    });
  }
};

/**
 * Asignar o actualizar impuesto a un producto
 */
const updateProductTax = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { productId, taxId } = req.params;
    const { is_exempt, custom_rate } = req.body;
    
    // Verificar si el producto existe
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }
    
    // Verificar si el impuesto existe
    const tax = await Tax.findByPk(taxId);
    if (!tax) {
      return res.status(404).json({
        success: false,
        error: 'Impuesto no encontrado'
      });
    }
    
    // Buscar si ya existe una asignación
    let productTax = await ProductTax.findOne({
      where: { product_id: productId, tax_id: taxId }
    });
    
    if (productTax) {
      // Actualizar existente
      await productTax.update({
        is_exempt: is_exempt !== undefined ? is_exempt : productTax.is_exempt,
        custom_rate: custom_rate !== undefined ? custom_rate : productTax.custom_rate
      }, { transaction });
    } else {
      // Crear nueva asignación
      productTax = await ProductTax.create({
        product_id: productId,
        tax_id: taxId,
        is_exempt: is_exempt !== undefined ? is_exempt : false,
        custom_rate
      }, { transaction });
    }
    
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      message: 'Asignación de impuesto actualizada exitosamente',
      data: productTax
    });
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error al actualizar asignación de impuesto`, { 
      error: error.message,
      productId: req.params.productId,
      taxId: req.params.taxId
    });
    res.status(500).json({
      success: false,
      error: 'Error al actualizar asignación de impuesto',
      details: error.message
    });
  }
};

/**
 * Eliminar asignación de impuesto a un producto
 */
const deleteProductTax = async (req, res) => {
  try {
    const { productId, taxId } = req.params;
    
    // Buscar si existe la asignación
    const productTax = await ProductTax.findOne({
      where: { product_id: productId, tax_id: taxId }
    });
    
    if (!productTax) {
      return res.status(404).json({
        success: false,
        error: 'Asignación de impuesto no encontrada'
      });
    }
    
    // Eliminar la asignación
    await productTax.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Asignación de impuesto eliminada exitosamente'
    });
  } catch (error) {
    logger.error(`Error al eliminar asignación de impuesto`, { 
      error: error.message,
      productId: req.params.productId,
      taxId: req.params.taxId
    });
    res.status(500).json({
      success: false,
      error: 'Error al eliminar asignación de impuesto',
      details: error.message
    });
  }
};

/**
 * Calcular impuestos para un carrito (simulación)
 */
const calculateCartTaxes = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Se requiere un array de ítems válido"
      });
    }
    
    // Obtener IDs de productos
    const productIds = items.map(item => item.productId);
    
    // Buscar los productos
    const products = await Product.findAll({
      where: { id: productIds }
    });
    
    // Crear mapa de productos para acceso fácil
    const productMap = {};
    products.forEach(product => {
      productMap[product.id] = product;
    });
    
    // Preparar ítems para cálculo de impuestos
    const itemsWithProducts = [];
    for (const item of items) {
      const product = productMap[item.productId];
      
      // Verificar que el producto existe
      if (!product) {
        return res.status(404).json({
          success: false,
          error: `Producto con ID ${item.productId} no encontrado`
        });
      }
      
      itemsWithProducts.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        product
      });
    }
    
    // Calcular impuestos
    const taxCalculation = await taxCalculator.calculateTaxes(itemsWithProducts);
    
    res.status(200).json({
      success: true,
      data: {
        subtotal: taxCalculation.subtotal,
        taxes: taxCalculation.taxesByType,
        totalTaxAmount: taxCalculation.totalTaxAmount,
        total: taxCalculation.total
      }
    });
  } catch (error) {
    logger.error('Error al calcular impuestos para carrito', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error al calcular impuestos',
      details: error.message
    });
  }
};

/**
 * Obtener impuestos asociados a un producto específico
 */
const getProductTaxesById = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Verificar si el producto existe
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }
    
    // Obtener impuestos aplicables al producto
    const productTaxes = await taxCalculator.getProductTaxes(productId);
    
    // Obtener información del producto para contexto
    const productInfo = {
      id: product.id,
      name: product.name,
      price: product.price
    };
    
    res.status(200).json({
      success: true,
      data: {
        product: productInfo,
        taxes: productTaxes
      }
    });
  } catch (error) {
    logger.error(`Error al obtener impuestos para producto ID ${req.params.productId}`, { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error al obtener impuestos del producto',
      details: error.message
    });
  }
};

/**
 * Aplicar impuesto a todos los productos
 */
const applyTaxToAllProducts = async (req, res) => {
  try {
    const { taxId } = req.params;
    const { is_exempt, custom_rate } = req.body;

    // Verificar que el impuesto existe
    const tax = await Tax.findByPk(taxId);
    if (!tax) {
      return res.status(404).json({
        success: false,
        error: 'Impuesto no encontrado'
      });
    }

    const products = await Product.findAll();
    const results = [];

    for (const product of products) {
      const [productTax] = await ProductTax.findOrCreate({
        where: { product_id: product.id, tax_id: taxId },
        defaults: { is_exempt, custom_rate }
      });
      results.push(productTax);
    }

    res.status(200).json({
      success: true,
      message: 'Impuesto aplicado a todos los productos',
      data: results
    });
  } catch (error) {
    logger.error('Error al aplicar impuesto a todos los productos', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error al aplicar impuesto a todos los productos',
      details: error.message
    });
  }
};

/**
 * Obtener productos por impuesto
 */
const getProductsByTax = async (req, res) => {
  try {
    const { taxId } = req.params;
    
    // Verificar que el impuesto existe
    const tax = await Tax.findByPk(taxId);
    if (!tax) {
      return res.status(404).json({
        success: false,
        error: 'Impuesto no encontrado'
      });
    }

    const products = await Product.findAll({
      include: [{
        model: ProductTax,
        where: { tax_id: taxId }
      }]
    });

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    logger.error('Error al obtener productos por impuesto', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error al obtener productos por impuesto',
      details: error.message
    });
  }
};

/**
 * Remover impuesto de productos seleccionados
 */
const removeTaxFromProducts = async (req, res) => {
  try {
    const { taxId } = req.params;
    const { productIds } = req.body;

    // Verificar que el impuesto existe
    const tax = await Tax.findByPk(taxId);
    if (!tax) {
      return res.status(404).json({
        success: false,
        error: 'Impuesto no encontrado'
      });
    }

    // Verificar que se proporcionaron IDs de productos
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Debe proporcionar al menos un ID de producto'
      });
    }

    // Eliminar las relaciones de impuesto-producto
    await ProductTax.destroy({
      where: {
        tax_id: taxId,
        product_id: productIds
      }
    });

    res.status(200).json({
      success: true,
      message: 'Impuesto removido de los productos seleccionados'
    });
  } catch (error) {
    logger.error('Error al remover impuesto de productos', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error al remover impuesto de productos',
      details: error.message
    });
  }
};

/**
 * Aplicar impuesto a productos seleccionados (por lotes)
 */
const applyTaxToSelectedProducts = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { taxId } = req.params;
    const { productIds, is_exempt, custom_rate } = req.body;

    // Verificar que el impuesto existe
    const tax = await Tax.findByPk(taxId);
    if (!tax) {
      return res.status(404).json({
        success: false,
        error: 'Impuesto no encontrado'
      });
    }

    // Verificar que se proporcionaron IDs de productos
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Debe proporcionar al menos un ID de producto'
      });
    }

    // Verificar que los productos existen
    const products = await Product.findAll({
      where: { id: productIds }
    });

    if (products.length !== productIds.length) {
      // Algunos productos no existen
      const foundIds = products.map(p => p.id);
      const missingIds = productIds.filter(id => !foundIds.includes(parseInt(id)));
      
      return res.status(404).json({
        success: false,
        error: 'Algunos productos no fueron encontrados',
        details: {
          missingIds
        }
      });
    }

    // Aplicar o actualizar impuesto a los productos seleccionados
    const results = [];

    for (const productId of productIds) {
      // Buscar si ya existe una asignación
      let productTax = await ProductTax.findOne({
        where: { product_id: productId, tax_id: taxId }
      });
      
      if (productTax) {
        // Actualizar existente
        await productTax.update({
          is_exempt: is_exempt !== undefined ? is_exempt : productTax.is_exempt,
          custom_rate: custom_rate !== undefined ? custom_rate : productTax.custom_rate
        }, { transaction });
      } else {
        // Crear nueva asignación
        productTax = await ProductTax.create({
          product_id: productId,
          tax_id: taxId,
          is_exempt: is_exempt !== undefined ? is_exempt : false,
          custom_rate
        }, { transaction });
      }
      
      results.push({
        productId,
        taxId,
        is_exempt: productTax.is_exempt,
        custom_rate: productTax.custom_rate
      });
    }

    await transaction.commit();
    
    res.status(200).json({
      success: true,
      message: `Impuesto aplicado exitosamente a ${results.length} productos`,
      data: {
        tax: {
          id: tax.id,
          name: tax.name,
          code: tax.code
        },
        results
      }
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error al aplicar impuesto a productos seleccionados', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error al aplicar impuesto a productos seleccionados',
      details: error.message
    });
  }
};

export {
  getAllTaxes,
  getTaxById,
  createTax,
  updateTax,
  deleteTax,
  updateProductTax,
  deleteProductTax,
  calculateCartTaxes,
  getProductTaxesById,
  applyTaxToAllProducts,
  applyTaxToSelectedProducts,
  getProductsByTax,
  removeTaxFromProducts
}; 