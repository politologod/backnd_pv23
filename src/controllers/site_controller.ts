import SiteConfig from '../models/model_siteConfig';
import {  validateString  } from '../utils/validator';
import logger from '../configs/logger';

/**
 * Obtener estado actual del modo mantenimiento
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
const getMaintenanceStatus = async (req, res) => {
  try {
    const config = await SiteConfig.findOne({ 
      where: { name: 'main', active: true } 
    });

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
  } catch (error) {
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
const toggleMaintenanceMode = async (req, res) => {
  try {
    const { enabled, message } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'El parámetro "enabled" debe ser un valor booleano'
      });
    }

    if (message && !validateString(message, { min: 5, max: 500 }).valid) {
      return res.status(400).json({
        success: false,
        message: 'El mensaje debe tener entre 5 y 500 caracteres'
      });
    }

    // Buscar o crear la configuración principal
    let [config, created] = await SiteConfig.findOrCreate({
      where: { name: 'main' },
      defaults: {
        name: 'main',
        maintenance_mode: false,
        active: true
      }
    });

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
  } catch (error) {
    logger.error('Error al cambiar modo mantenimiento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export {
  getMaintenanceStatus,
  toggleMaintenanceMode
}; 