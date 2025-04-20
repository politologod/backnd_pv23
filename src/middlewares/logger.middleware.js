const morgan = require('morgan');
const { logger } = require('../configs/logger');

/**
 * Sistema de Logging para la API
 * 
 * Este módulo provee middlewares para:
 * 1. Registrar todas las solicitudes HTTP (requestLogger)
 * 2. Agregar contexto a los logs (requestContextLogger)
 * 3. Registrar errores detallados (errorLogger)
 * 
 * Los logs se almacenan en:
 * - Archivos rotativos diarios en /logs
 * - La consola durante desarrollo
 * - Los archivos JSON son metadatos necesarios para la rotación
 */

// Middleware para loguear las solicitudes con formato enriquecido
const requestLogger = morgan('combined');

// Middleware para loguear errores con información detallada
const errorLogger = (err, req, res, next) => {
  // Simplificamos a console.error para evitar problemas
  console.error(`[ERROR] ${err.status || 500} - ${err.message || 'Error del servidor'} - ${req.method} ${req.originalUrl || req.url}`);
  
  if (err.stack) {
    console.error(err.stack);
  }
  
  next(err);
};

// Middleware para añadir información contextual a los logs
const requestContextLogger = (req, res, next) => {
  // Generar un ID de solicitud si no existe
  req.id = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Solo establecemos el encabezado si no se han enviado ya
  if (!res.headersSent) {
    res.setHeader('X-Request-ID', req.id);
  }
  
  // Interceptar el final de la solicitud para loguear la respuesta
  const originalEnd = res.end;
  
  res.end = function(...args) {
    // Asegurarnos de que no interfiere con el flujo normal
    if (this.writableEnded) {
      return originalEnd.apply(this, args);
    }
    
    const responseTime = Date.now() - (req._startTime || Date.now());
    const statusCode = res.statusCode;
    
    // Solo logueamos errores o en modo desarrollo
    if (process.env.NODE_ENV !== 'production' || statusCode >= 400) {
      const message = `${req.method} ${req.originalUrl || req.url} ${statusCode} ${responseTime}ms`;
      
      if (statusCode >= 500) {
        console.error(`[${statusCode}] ${message}`);
      } else if (statusCode >= 400) {
        console.warn(`[${statusCode}] ${message}`);
      } else {
        console.info(`[${statusCode}] ${message}`);
      }
    }
    
    originalEnd.apply(this, args);
  };
  
  // Marcar el tiempo de inicio
  req._startTime = Date.now();
  next();
};

/**
 * Limpia los logs antiguos según la configuración
 * La limpieza se realiza automáticamente gracias a winston-daily-rotate-file
 * con las configuraciones maxFiles de cada transport
 */

module.exports = { requestLogger, errorLogger, requestContextLogger }; 