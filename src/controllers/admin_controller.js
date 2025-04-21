const Order = require('../models/model_order');
const OrderItem = require('../models/model_orderItem');
const Product = require('../models/model_products');
const User = require('../models/model_user');
const OrderStatusHistory = require('../models/model_orderStatusHistory');
const SiteConfig = require('../models/model_siteConfig');
const Category = require('../models/model_category');
const sequelize = require('../configs/database');
const { logger } = require('../configs/logger');
const { QueryTypes, Op } = require('sequelize');

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

    console.info(`Modo de mantenimiento actualizado por usuario ${userId}: ${maintenance_mode}`);
    
    return res.status(200).json({
      success: true,
      message: 'Modo de mantenimiento actualizado exitosamente',
      data: {
        maintenance_mode: config.maintenance_mode,
        maintenance_message: config.maintenance_message
      }
    });
  } catch (error) {
    console.error('Error al actualizar el modo de mantenimiento', error.message);
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
    console.error(`Error al obtener modo de mantenimiento: ${error.message}`);
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
    const totalSales = await Order.sum('total', { where: { status: 'entregado' } });
    const totalOrders = await Order.count();
    const totalCustomers = await User.count({ where: { role: 'customer' } });
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
    console.error(`Error al obtener estadísticas generales: ${error.message}`);
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
      JOIN Products p ON oi.productId = p.id
      JOIN Categories c ON p.categoryId = c.id
      JOIN Orders o ON oi.orderId = o.id
      WHERE o.status = 'entregado'
      GROUP BY c.id, c.name
      ORDER BY total DESC
    `, { type: sequelize.QueryTypes.SELECT });

    return res.status(200).json({
      success: true,
      data: salesByCategory
    });
  } catch (error) {
    console.error(`Error al obtener ventas por categoría: ${error.message}`);
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
        EXTRACT(MONTH FROM "createdAt") as month, 
        COUNT(*) as count,
        SUM(CASE WHEN status = 'entregado' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pendiente por pagar' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) as cancelled
      FROM Orders
      WHERE EXTRACT(YEAR FROM "createdAt") = :year
      GROUP BY EXTRACT(MONTH FROM "createdAt")
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
    console.error(`Error al obtener órdenes por mes: ${error.message}`);
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
        EXTRACT(MONTH FROM "createdAt") as month, 
        COUNT(*) as count
      FROM Users
      WHERE role = 'customer' AND EXTRACT(YEAR FROM "createdAt") = :year
      GROUP BY EXTRACT(MONTH FROM "createdAt")
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
    console.error(`Error al obtener clientes por mes: ${error.message}`);
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
        EXTRACT(MONTH FROM "createdAt") as month, 
        SUM(total) as total
      FROM Orders
      WHERE status = 'entregado' AND EXTRACT(YEAR FROM "createdAt") = :year
      GROUP BY EXTRACT(MONTH FROM "createdAt")
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
    console.error(`Error al obtener ventas por mes: ${error.message}`);
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
        status: 'entregado',
        [Op.and]: [
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM "createdAt"')), currentMonth),
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM "createdAt"')), currentYear)
        ]
      }
    });

    // Ventas del mes anterior
    const previousMonthSales = await Order.sum('total', {
      where: {
        status: 'entregado',
        [Op.and]: [
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM "createdAt"')), previousMonth),
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM "createdAt"')), previousMonthYear)
        ]
      }
    });

    // Órdenes del mes actual
    const currentMonthOrders = await Order.count({
      where: {
        [Op.and]: [
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM "createdAt"')), currentMonth),
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM "createdAt"')), currentYear)
        ]
      }
    });

    // Órdenes del mes anterior
    const previousMonthOrders = await Order.count({
      where: {
        [Op.and]: [
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM "createdAt"')), previousMonth),
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM "createdAt"')), previousMonthYear)
        ]
      }
    });

    // Nuevos clientes del mes actual
    const currentMonthCustomers = await User.count({
      where: {
        role: 'customer',
        [Op.and]: [
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM "createdAt"')), currentMonth),
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM "createdAt"')), currentYear)
        ]
      }
    });

    // Nuevos clientes del mes anterior
    const previousMonthCustomers = await User.count({
      where: {
        role: 'customer',
        [Op.and]: [
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM "createdAt"')), previousMonth),
          sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM "createdAt"')), previousMonthYear)
        ]
      }
    });

    // Productos más vendidos
    const topProducts = await sequelize.query(`
      SELECT 
        p.id, p.name, p.price, p.description, p.imageUrl,
        SUM(oi.quantity) as total_sold
      FROM OrderItems oi
      JOIN Products p ON oi.productId = p.id
      JOIN Orders o ON oi.orderId = o.id
      WHERE o.status = 'entregado'
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
    console.error(`Error al obtener estadísticas del dashboard: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del dashboard',
      error: error.message
    });
  }
};

module.exports = {
  setMaintenanceMode,
  getMaintenanceMode,
  getGeneralStats,
  getSalesByCategory,
  getOrdersByMonth,
  getCustomersByMonth,
  getSalesByMonth,
  getDashboardStats
}; 