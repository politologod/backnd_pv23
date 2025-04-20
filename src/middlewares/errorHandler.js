const { error, debug } = require('../configs/logger');

/**
 * Middleware centralizado para manejar errores en la aplicación
 * Registra los errores y devuelve respuestas adecuadas
 */
const errorHandler = (err, req, res, next) => {
  // Determinar el código de estado (usar 500 por defecto)
  const statusCode = err.statusCode || 500;
  
  // Crear una respuesta estructurada para el cliente
  const errorResponse = {
    success: false,
    status: statusCode,
    message: statusCode === 500 ? 'Error interno del servidor' : err.message,
    // Solo incluir detalles del error en ambientes no productivos
    ...(process.env.NODE_ENV !== 'production' && { 
      error: err.name,
      stack: err.stack,
      details: err.details || null
    })
  };
  
  // Estructura para el logger
  const logData = {
    requestId: req.id,
    path: req.originalUrl || req.url,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id || 'anónimo',
    statusCode,
    errorName: err.name,
    errorMessage: err.message,
    errorStack: err.stack,
    errorDetails: err.details || null
  };
  
  // Registrar el error con el nivel adecuado
  error(`Error en ${req.method} ${req.originalUrl || req.url}: ${err.message}`, logData);
  
  // Para errores 500, registrar más detalles a nivel de debug
  if (statusCode === 500) {
    debug('Detalles del error interno:', {
      stack: err.stack,
      error: err
    });
  }
  
  // Enviar respuesta al cliente
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler; 