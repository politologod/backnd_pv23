/**
 * Utilidad para cálculo de impuestos
 */
import {  Tax, ProductTax, Product  } from '../models';
import logger from '../configs/logger';

/**
 * Obtiene todos los impuestos activos
 * @returns {Promise<Array>} Lista de impuestos activos
 */
const getActiveTaxes = async () => {
  try {
    return await Tax.findAll({
      where: { active: true },
      order: [['name', 'ASC']]
    });
  } catch (error) {
    logger.error('Error al obtener impuestos activos', { error: (error as Error).message });
    throw error;
  }
};

/**
 * Obtiene los impuestos específicos aplicables a un producto
 * @param {number} productId - ID del producto
 * @returns {Promise<Array>} Lista de impuestos aplicables al producto
 */
const getProductTaxes = async (productId: number) => {
  try {
    // Buscar relaciones específicas de producto-impuesto
    const productTaxes = await ProductTax.findAll({
      where: { product_id: productId },
      include: [{ model: Tax, where: { active: true } }]
    });
    
    // Si hay relaciones específicas, usarlas
    if (productTaxes.length > 0) {
      return productTaxes.map((pt: any) => {
        return {
          ...(pt as any).Tax.dataValues,
          isExempt: (pt as any).is_exempt,
          customRate: (pt as any).custom_rate
        };
      }).filter((tax: any) => !tax.isExempt); // Filtrar exentos
    }
    
    // Si no hay relaciones específicas, obtener impuestos generales
    const generalTaxes = await Tax.findAll({
      where: { active: true, applies_to_all: true }
    });
    
    return generalTaxes;
  } catch (error) {
    logger.error(`Error al obtener impuestos para producto ${productId}`, { error: (error as Error).message });
    throw error;
  }
};

/**
 * Calcula el monto de impuesto para un ítem
 * @param {Object} item - Item del carrito o orden
 * @param {Object} item.product - Producto asociado al ítem
 * @param {number} item.quantity - Cantidad
 * @param {number} item.price - Precio unitario
 * @returns {Promise<Object>} Detalles del cálculo de impuestos
 */
const calculateItemTaxes = async (item: any) => {
  try {
    const productId = item.productId || item.product.id;
    const price = item.price || item.product.price;
    const quantity = item.quantity;
    const subtotal = price * quantity;
    
    // Obtener impuestos aplicables al producto
    const taxes = await getProductTaxes(productId);
    
    let totalTaxAmount = 0;
    const taxDetails = [];
    
    // Calcular cada impuesto
    for (const tax of taxes) {
      // Usar tasa personalizada si existe, de lo contrario usar la tasa general
      const rate = tax.customRate || tax.rate;
      
      // Calcular monto del impuesto
      let taxAmount;
      if (tax.is_percentage) {
        taxAmount = (subtotal * rate) / 100;
      } else {
        // Para impuestos de monto fijo, multiplicar por cantidad
        taxAmount = rate * quantity;
      }
      
      // Redondear a 2 decimales
      taxAmount = Math.round(taxAmount * 100) / 100;
      
      // Agregar al total
      totalTaxAmount += taxAmount;
      
      // Guardar detalles
      taxDetails.push({
        taxId: tax.id,
        name: tax.name,
        code: tax.code,
        rate: tax.customRate || tax.rate,
        isPercentage: tax.is_percentage,
        amount: taxAmount
      });
    }
    
    return {
      subtotal,
      taxDetails,
      totalTaxAmount,
      total: subtotal + totalTaxAmount
    };
  } catch (error) {
    logger.error('Error al calcular impuestos para ítem', { 
      error: (error as Error).message,
      item: {
        productId: item.productId || item.product.id,
        quantity: item.quantity
      }
    });
    throw error;
  }
};

/**
 * Calcula impuestos para múltiples ítems (carrito o orden)
 * @param {Array} items - Lista de ítems
 * @returns {Promise<Object>} Detalles del cálculo de impuestos
 */
const calculateTaxes = async (items: any[]) => {
  try {
    let subtotal = 0;
    let totalTaxAmount = 0;
    const allTaxDetails = [];
    const taxesByType: any = {}; // Para agrupar impuestos por tipo
    
    // Calcular impuestos para cada ítem
    for (const item of items) {
      const itemTaxes = await calculateItemTaxes(item);
      
      subtotal += itemTaxes.subtotal;
      totalTaxAmount += itemTaxes.totalTaxAmount;
      
      // Agregar detalles de impuestos agrupados por tipo
      for (const taxDetail of itemTaxes.taxDetails) {
        const taxKey = taxDetail.code;
        
        if (!taxesByType[taxKey]) {
          taxesByType[taxKey] = {
            taxId: taxDetail.taxId,
            name: taxDetail.name,
            code: taxDetail.code,
            rate: taxDetail.rate,
            isPercentage: taxDetail.isPercentage,
            amount: 0
          };
        }
        
        taxesByType[taxKey].amount += taxDetail.amount;
        // Redondear a 2 decimales
        taxesByType[taxKey].amount = Math.round(taxesByType[taxKey].amount * 100) / 100;
      }
      
      allTaxDetails.push(...itemTaxes.taxDetails);
    }
    
    // Convertir objeto a array
    const groupedTaxDetails = Object.values(taxesByType);
    
    return {
      subtotal,
      taxesByType: groupedTaxDetails,
      taxDetails: allTaxDetails, // Detalles sin agrupar (opcional)
      totalTaxAmount,
      total: subtotal + totalTaxAmount
    };
  } catch (error) {
    logger.error('Error al calcular impuestos para múltiples ítems', { error: (error as Error).message });
    throw error;
  }
};

export default {
  getActiveTaxes,
  getProductTaxes,
  calculateItemTaxes,
  calculateTaxes
}; 