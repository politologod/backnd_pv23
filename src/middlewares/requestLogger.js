const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const { logger, stream } = require('../configs/logger');

/**
 * Middleware para asignar un ID único a cada solicitud y registrar detalles
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función para pasar al siguiente middleware
 */
const requestIdMiddleware = (req, res, next) => {
  // Generar un ID único para la solicitud
  const requestId = uuidv4();
  req.id = requestId;
  
  // Añadir el ID a las cabeceras de respuesta
  res.setHeader('X-Request-ID', requestId);
  
  // Añadir información del usuario si está autenticado
  if (req.user) {
    req.userId = req.user.id;
  }
  
  next();
};

// Formato personalizado para Morgan
const morganFormat = (tokens, req, res) => {
  return JSON.stringify({
    'request-id': req.id,
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: parseInt(tokens.status(req, res)),
    'content-length': tokens.res(req, res, 'content-length'),
    'response-time': `${tokens['response-time'](req, res)} ms`,
    'user-agent': tokens['user-agent'](req, res),
    'remote-addr': tokens['remote-addr'](req, res),
    'user-id': req.userId || 'no-auth'
  });
};

// Middleware de Morgan con nuestro formato personalizado
const httpLogger = morgan(morganFormat, { stream });

/**
 * Middleware para registrar el cuerpo de la solicitud (solo en desarrollo)
 */
const requestBodyLogger = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    const { method, url, body, query, params } = req;
    
    logger.debug('Detalles de solicitud entrante', {
      requestId: req.id,
      method,
      url,
      ...(Object.keys(body || {}).length > 0 && { body }),
      ...(Object.keys(query || {}).length > 0 && { query }),
      ...(Object.keys(params || {}).length > 0 && { params })
    });
  }
  next();
};

module.exports = {
  requestIdMiddleware,
  httpLogger,
  requestBodyLogger
}; 