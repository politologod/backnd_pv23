/**
 * Script para actualizar órdenes existentes con campos de impuestos
 * Este script migra los datos existentes para usar el nuevo modelo de impuestos
 */
require('dotenv').config();
const { Order, sequelize } = require('../models');
const logger = require('../configs/logger');

async function updateExistingOrders() {
  const t = await sequelize.transaction();
  
  try {
    console.log('🔄 Iniciando actualización de órdenes existentes...');
    
    // Obtener todas las órdenes existentes
    const orders = await Order.findAll({ transaction: t });
    console.log(`📋 Encontradas ${orders.length} órdenes para actualizar`);
    
    // Para cada orden, actualizar los campos de impuestos
    for (const order of orders) {
      // Establecer subtotal igual al total (asumiendo que no había impuestos antes)
      const subtotal = parseFloat(order.total) || 0;
      
      // Actualizar la orden
      await order.update({
        subtotal: subtotal,
        taxes_amount: 0.00, // Sin impuestos previos
        taxes_details: [] // Sin detalles de impuestos previos
      }, { transaction: t });
      
      console.log(`✅ Orden ID ${order.id} actualizada: subtotal=${subtotal}, total=${order.total}`);
    }
    
    // Confirmar transacción
    await t.commit();
    console.log('✅ Actualización de órdenes completada exitosamente');
    
    // Ahora podemos modificar de nuevo el modelo para hacer los campos obligatorios
    console.log('ℹ️ Ahora puedes modificar el modelo Order para hacer los campos obligatorios nuevamente');
    
  } catch (error) {
    // Revertir cambios en caso de error
    await t.rollback();
    console.error('❌ Error durante la actualización de órdenes:', error);
    logger.error('Error en actualización de órdenes', { error: error.message });
  } finally {
    // Cerrar conexión
    await sequelize.close();
  }
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
  updateExistingOrders()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Error fatal:', err);
      process.exit(1);
    });
}

module.exports = updateExistingOrders; 