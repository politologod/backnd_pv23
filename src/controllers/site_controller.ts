import SiteConfig from '../models/model_siteConfig';
import validator from '../utils/validator';
import logger from '../configs/logger';
import { Request, Response } from 'express';


/**
 * Obtener estado actual del modo mantenimiento
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
const getMaintenanceStatus = async (req: Request, res: Response) => {
  try {
    const config = await SiteConfig.findOne({ 
      where: { name: 'main', active: true } 
    }) as any;

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        maintenance_mode: config.maintenance_mode,
        maintenance_message: config.maintenance_message
      }
    });
  } catch (error: unknown) {
    logger.error('Error al obtener estado de mantenimiento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Activar o desactivar el modo mantenimiento
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
const toggleMaintenanceMode = async (req: Request, res: Response) => {
  try {
    const { enabled, message } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'El parámetro "enabled" debe ser un valor booleano'
      });
    }

    if (message && !validator.validateString(message, { min: 5, max: 500 }).valid) {
      return res.status(400).json({
        success: false,
        message: 'El mensaje debe tener entre 5 y 500 caracteres'
      });
    }

    // Buscar o crear la configuración principal
    const [config] = await SiteConfig.findOrCreate({
      where: { name: 'main' },
      defaults: {
        name: 'main',
        maintenance_mode: false,
        active: true
      } as any
    }) as any[];

    // Actualizar configuración
    config.maintenance_mode = enabled;
    
    if (message) {
      config.maintenance_message = message;
    }
    
    await config.save();

    return res.status(200).json({
      success: true,
      message: enabled 
        ? 'Modo mantenimiento activado correctamente' 
        : 'Modo mantenimiento desactivado correctamente',
      data: {
        maintenance_mode: config.maintenance_mode,
        maintenance_message: config.maintenance_message
      }
    });
  } catch (error: unknown) {
    logger.error('Error al cambiar modo mantenimiento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener configuración completa de la tienda
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
const getStoreConfig = async (req: Request, res: Response) => {
  try {
    const config = await SiteConfig.findOne({
      where: { name: 'main' }
    }) as any;

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        name: config.name,
        description: config.description,
        logoUrl: config.logoUrl,
        primaryColor: config.primaryColor,
        paymentMethods: config.paymentMethods,
        shippingMethods: config.shippingMethods,
        currencyConfig: config.currencyConfig,
        schedule: config.schedule,
        maintenance_mode: config.maintenance_mode
      }
    });
  } catch (error: unknown) {
    logger.error('Error al obtener configuración de la tienda:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Actualizar configuración de la tienda (solo admin)
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
const updateStoreConfig = async (req: Request, res: Response) => {
  try {
    const {
      description,
      logoUrl,
      primaryColor,
      paymentMethods,
      shippingMethods,
      currencyConfig,
      schedule,
      maintenance_mode
    } = req.body;

    // Buscar o crear la configuración principal
    const [config] = await SiteConfig.findOrCreate({
      where: { name: 'main' },
      defaults: {
        name: 'main',
        maintenance_mode: false,
        active: true
      } as any
    }) as any[];

    // Solo actualizar los campos que fueron enviados en el body
    if (description !== undefined) config.description = description;
    if (logoUrl !== undefined) config.logoUrl = logoUrl;
    if (primaryColor !== undefined) config.primaryColor = primaryColor;
    if (paymentMethods !== undefined) config.paymentMethods = paymentMethods;
    if (shippingMethods !== undefined) config.shippingMethods = shippingMethods;
    if (currencyConfig !== undefined) config.currencyConfig = currencyConfig;
    if (schedule !== undefined) config.schedule = schedule;
    if (maintenance_mode !== undefined) config.maintenance_mode = maintenance_mode;

    await config.save();

    return res.status(200).json({
      success: true,
      message: 'Configuración actualizada correctamente',
      data: config
    });
  } catch (error: unknown) {
    logger.error('Error al actualizar configuración de la tienda:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener horario de la tienda
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
const getSchedule = async (req: Request, res: Response) => {
  try {
    const config = await SiteConfig.findOne({
      where: { name: 'main' }
    }) as any;

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        schedule: config.schedule
      }
    });
  } catch (error: unknown) {
    logger.error('Error al obtener horario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Actualizar horario de la tienda (solo admin)
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
const updateSchedule = async (req: Request, res: Response) => {
  try {
    const { schedule } = req.body;

    // Buscar o crear la configuración principal
    const [config] = await SiteConfig.findOrCreate({
      where: { name: 'main' },
      defaults: {
        name: 'main',
        maintenance_mode: false,
        active: true
      } as any
    }) as any[];

    config.schedule = schedule;
    await config.save();

    return res.status(200).json({
      success: true,
      message: 'Horario actualizado correctamente',
      data: {
        schedule: config.schedule
      }
    });
  } catch (error: unknown) {
    logger.error('Error al actualizar horario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export {
  getMaintenanceStatus,
  toggleMaintenanceMode,
  getStoreConfig,
  updateStoreConfig,
  getSchedule,
  updateSchedule
};