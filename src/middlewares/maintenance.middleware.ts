/**
 * Middleware para controlar el modo de mantenimiento
 * Permite a los administradores acceder a todas las rutas incluso cuando el modo de mantenimiento está activo
 * Si el modo de mantenimiento está activo, los usuarios normales reciben un error 503
 */

import db from '../models';
import logger from '../configs/logger';
import { Request, Response, NextFunction } from 'express';


let maintenanceModeActive = false;

// Función para obtener el estado actual del modo de mantenimiento
const getMaintenanceMode = () => {
  return maintenanceModeActive;
};

// Función para activar/desactivar el modo de mantenimiento
const setMaintenanceMode = (active) => {
  maintenanceModeActive = active;
  logger.info(`Modo de mantenimiento ${active ? 'activado' : 'desactivado'}`);
  return maintenanceModeActive;
};

// Middleware para verificar si el sitio está en mantenimiento
const maintenanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Si el modo de mantenimiento no está activo, continuar
  if (!maintenanceModeActive) {
    return next();
  }

  // Verificar si el usuario es administrador
  if (req.user && req.user.role === 'admin') {
    // Permitir acceso a los administradores
    return next();
  }

  // Para usuarios no administradores, devolver error 503
  return res.status(503).json({
    success: false,
    message: 'El sitio está en mantenimiento. Por favor, inténtelo de nuevo más tarde.'
  });
};

export default maintenanceMiddleware;
export { getMaintenanceMode, setMaintenanceMode }; 