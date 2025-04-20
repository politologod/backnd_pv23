const Order = require('../models/model_order');
const OrderItem = require('../models/model_orderItem');
const Product = require('../models/model_products');
const User = require('../models/model_user');
const OrderStatusHistory = require('../models/model_orderStatusHistory');
const SiteConfig = require('../models/model_siteConfig');
const Category = require('../models/model_category');
const sequelize = require('../configs/database');
const logger = require('../configs/logger');
const { QueryTypes, Op } = require('sequelize');

/**
 * Actualiza el estado de una orden (solo admin)
 */
const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status, notes } = req.body;
  
  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'El estado de la orden es requerido'
    });
  }

  const validStatuses = [
    'pendiente por pagar', 
    'pagado y procesando', 
    'enviado', 
    'entregado', 
    'cancelado'
  ];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Estado no válido. Estados válidos: ${validStatuses.join(', ')}`
    });
  }

  try {
    // Iniciar transacción
    const transaction = await sequelize.transaction();
    
    try {
      const order = await Order.findByPk(orderId);
      
      if (!order) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
      }
      
      // Si el estado es el mismo, no hacemos cambios
      if (order.status === status) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'La orden ya tiene este estado'
        });
      }
      
      // Actualizar el estado de la orden
      const oldStatus = order.status;
      await order.update({ status }, { transaction });
      
      // Registrar el cambio en el historial
      await OrderStatusHistory.create({
        orderId,
        status,
        previousStatus: oldStatus,
        notes: notes || `Estado actualizado de "${oldStatus}" a "${status}"`,
        updatedBy: req.user.id,
        updatedByRole: req.user.role
      }, { transaction });
      
      // Si la orden fue cancelada y estaba pagada, se podría procesar la devolución aquí
      
      // Confirmar transacción
      await transaction.commit();
      
      // Obtener la orden actualizada con su historial
      const updatedOrder = await Order.findByPk(orderId, {
        include: [
          { 
            model: OrderStatusHistory,
            limit: 10,
            order: [['createdAt', 'DESC']]
          }
        ]
      });
      
      res.status(200).json({
        success: true,
        message: 'Estado de la orden actualizado correctamente',
        order: {
          id: order.id,
          status: order.status,
          history: updatedOrder.OrderStatusHistories
        }
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    logger.error('Error al actualizar el estado de la orden', { error: error.message, orderId });
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado de la orden',
      error: error.message
    });
  }
};

/**
 * Obtiene el historial de estados de una orden
 */
const getOrderStatusHistory = async (req, res) => {
  const { orderId } = req.params;
  
  try {
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }
    
    const history = await OrderStatusHistory.findAll({
      where: { orderId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    logger.error('Error al obtener el historial de estados de la orden', { error: error.message, orderId });
    res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de estados de la orden',
      error: error.message
    });
  }
};

/**
 * Actualiza el estado del modo de mantenimiento del sitio
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @returns {Object} - Respuesta JSON
 */
const setMaintenanceMode = async (req, res) => {
  try {
    const { maintenance_mode, maintenance_message } = req.body;
    const userId = req.user.id;

    if (maintenance_mode === undefined) {
      return res.status(400).json({
        success: false,
        message: 'El campo maintenance_mode es requerido'
      });
    }

    // Buscar configuración existente o crear una nueva
    let config = await SiteConfig.findOne({ where: { active: true } });
    
    if (config) {
      await config.update({
        maintenance_mode,
        maintenance_message,
        last_updated_by: userId
      });
    } else {
      config = await SiteConfig.create({
        maintenance_mode,
        maintenance_message,
        last_updated_by: userId
      });
    }

    logger.info(`Modo de mantenimiento actualizado por usuario ${userId}: ${maintenance_mode}`);
    
    return res.status(200).json({
      success: true,
      message: 'Modo de mantenimiento actualizado exitosamente',
      data: {
        maintenance_mode: config.maintenance_mode,
        maintenance_message: config.maintenance_message
      }
    });
  } catch (error) {
    logger.error(`Error al actualizar modo de mantenimiento: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar el modo de mantenimiento',
      error: error.message
    });
  }
};

/**
 * Obtiene el estado actual del modo de mantenimiento
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @returns {Object} - Respuesta JSON
 */
const getMaintenanceMode = async (req, res) => {
  try {
    // Buscar configuración existente o crear una por defecto
    let config = await SiteConfig.findOne({ 
      where: { active: true },
      include: [{ 
        model: User, 
        as: 'lastUpdatedBy',
        attributes: ['id', 'name', 'email'] 
      }]
    });

    if (!config) {
      config = await SiteConfig.create({
        maintenance_mode: false,
        maintenance_message: null,
        last_updated_by: req.user.id
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        maintenance_mode: config.maintenance_mode,
        maintenance_message: config.maintenance_message,
        last_updated_by: config.lastUpdatedBy,
        updated_at: config.updatedAt
      }
    });
  } catch (error) {
    logger.error(`Error al obtener modo de mantenimiento: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el modo de mantenimiento',
      error: error.message
    });
  }
};

/**
 * Obtiene estadísticas generales del sitio
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @returns {Object} - Respuesta JSON con estadísticas
 */
const getGeneralStats = async (req, res) => {
  try {
    // Estadísticas totales
    const totalSales = await Order.sum('total', { where: { status: 'completed' } });
    const totalOrders = await Order.count();
    const totalCustomers = await User.count({ where: { role: 'client' } });
    const totalProducts = await Product.count({ where: { active: true } });
    const totalCategories = await Category.count({ where: { active: true } });

    return res.status(200).json({
      success: true,
      data: {
        total_sales: totalSales || 0,
        total_orders: totalOrders || 0,
        total_customers: totalCustomers || 0,
        total_products: totalProducts || 0,
        total_categories: totalCategories || 0
      }
    });
  } catch (error) {
    logger.error(`Error al obtener estadísticas generales: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas generales',
      error: error.message
    });
  }
};

/**
 * Obtiene estadísticas de ventas por categoría
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @returns {Object} - Respuesta JSON con estadísticas por categoría
 */
const getSalesByCategory = async (req, res) => {
  try {
    const salesByCategory = await sequelize.query(`
      SELECT c.name as category, SUM(oi.quantity * oi.price) as total
      FROM OrderItems oi
      JOIN Products p ON oi.product_id = p.id
      JOIN Categories c ON p.category_id = c.id
      JOIN Orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
      GROUP BY c.id, c.name
      ORDER BY total DESC
    `, { type: sequelize.QueryTypes.SELECT });

    return res.status(200).json({
      success: true,
      data: salesByCategory
    });
  } catch (error) {
    logger.error(`Error al obtener ventas por categoría: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener ventas por categoría',
      error: error.message
    });
  }
};

/**
 * Obtiene estadísticas de órdenes por mes
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @returns {Object} - Respuesta JSON con estadísticas de órdenes por mes
 */
const getOrdersByMonth = async (req, res) => {
  try {
    // Obtener año de la consulta o usar el año actual
    const year = req.query.year || new Date().getFullYear();
    
    const ordersByMonth = await sequelize.query(`
      SELECT 
        EXTRACT(MONTH FROM created_at) as month, 
        COUNT(*) as count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM Orders
      WHERE EXTRACT(YEAR FROM created_at) = :year
      GROUP BY EXTRACT(MONTH FROM created_at)
      ORDER BY month
    `, {
      replacements: { year },
      type: sequelize.QueryTypes.SELECT
    });

    return res.status(200).json({
      success: true,
      data: {
        year,
        ordersByMonth
      }
    });
  } catch (error) {
    logger.error(`Error al obtener órdenes por mes: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes por mes',
      error: error.message
    });
  }
};

/**
 * Obtiene estadísticas de clientes nuevos por mes
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @returns {Object} - Respuesta JSON con estadísticas de clientes por mes
 */
const getCustomersByMonth = async (req, res) => {
  try {
    // Obtener año de la consulta o usar el año actual
    const year = req.query.year || new Date().getFullYear();
    
    const customersByMonth = await sequelize.query(`
      SELECT 
        EXTRACT(MONTH FROM created_at) as month, 
        COUNT(*) as count
      FROM Users
      WHERE role = 'client' AND EXTRACT(YEAR FROM created_at) = :year
      GROUP BY EXTRACT(MONTH FROM created_at)
      ORDER BY month
    `, {
      replacements: { year },
      type: sequelize.QueryTypes.SELECT
    });

    return res.status(200).json({
      success: true,
      data: {
        year,
        customersByMonth
      }
    });
  } catch (error) {
    logger.error(`Error al obtener clientes por mes: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener clientes por mes',
      error: error.message
    });
  }
};

/**
 * Obtiene estadísticas de ventas por mes
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @returns {Object} - Respuesta JSON con estadísticas de ventas por mes
 */
const getSalesByMonth = async (req, res) => {
  try {
    // Obtener año de la consulta o usar el año actual
    const year = req.query.year || new Date().getFullYear();
    
    const salesByMonth = await sequelize.query(`
      SELECT 
        EXTRACT(MONTH FROM created_at) as month, 
        SUM(total) as total
      FROM Orders
      WHERE status = 'completed' AND EXTRACT(YEAR FROM created_at) = :year
      GROUP BY EXTRACT(MONTH FROM created_at)
      ORDER BY month
    `, {
      replacements: { year },
      type: sequelize.QueryTypes.SELECT
    });

    return res.status(200).json({
      success: true,
      data: {
        year,
        salesByMonth
      }
    });
  } catch (error) {
    logger.error(`Error al obtener ventas por mes: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener ventas por mes',
      error: error.message
    });
  }
};

/**
 * Obtiene estadísticas para el dashboard
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @returns {Object} - Respuesta JSON con estadísticas para el dashboard
 */
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Ventas del mes actual
    const currentMonthSales = await Order.sum('total', {
      where: {
        status: 'completed',
        [Op.and]: [
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM created_at')), currentMonth),
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM created_at')), currentYear)
        ]
      }
    });

    // Ventas del mes anterior
    const previousMonthSales = await Order.sum('total', {
      where: {
        status: 'completed',
        [Op.and]: [
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM created_at')), previousMonth),
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM created_at')), previousMonthYear)
        ]
      }
    });

    // Órdenes del mes actual
    const currentMonthOrders = await Order.count({
      where: {
        [Op.and]: [
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM created_at')), currentMonth),
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM created_at')), currentYear)
        ]
      }
    });

    // Órdenes del mes anterior
    const previousMonthOrders = await Order.count({
      where: {
        [Op.and]: [
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM created_at')), previousMonth),
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM created_at')), previousMonthYear)
        ]
      }
    });

    // Nuevos clientes del mes actual
    const currentMonthCustomers = await User.count({
      where: {
        role: 'client',
        [Op.and]: [
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM created_at')), currentMonth),
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM created_at')), currentYear)
        ]
      }
    });

    // Nuevos clientes del mes anterior
    const previousMonthCustomers = await User.count({
      where: {
        role: 'client',
        [Op.and]: [
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM created_at')), previousMonth),
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM created_at')), previousMonthYear)
        ]
      }
    });

    // Productos más vendidos
    const topProducts = await sequelize.query(`
      SELECT 
        p.id, p.name, p.price, p.description, p.image_url,
        SUM(oi.quantity) as total_sold
      FROM OrderItems oi
      JOIN Products p ON oi.product_id = p.id
      JOIN Orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
      LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });

    return res.status(200).json({
      success: true,
      data: {
        current_month: {
          sales: currentMonthSales || 0,
          orders: currentMonthOrders || 0,
          new_customers: currentMonthCustomers || 0
        },
        previous_month: {
          sales: previousMonthSales || 0,
          orders: previousMonthOrders || 0,
          new_customers: previousMonthCustomers || 0
        },
        growth: {
          sales: previousMonthSales ? ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100 : 0,
          orders: previousMonthOrders ? ((currentMonthOrders - previousMonthOrders) / previousMonthOrders) * 100 : 0,
          customers: previousMonthCustomers ? ((currentMonthCustomers - previousMonthCustomers) / previousMonthCustomers) * 100 : 0
        },
        top_products: topProducts
      }
    });
  } catch (error) {
    logger.error(`Error al obtener estadísticas del dashboard: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del dashboard',
      error: error.message
    });
  }
};

module.exports = {
  updateOrderStatus,
  getOrderStatusHistory,
  setMaintenanceMode,
  getMaintenanceMode,
  getGeneralStats,
  getSalesByCategory,
  getOrdersByMonth,
  getCustomersByMonth,
  getSalesByMonth,
  getDashboardStats
}; 