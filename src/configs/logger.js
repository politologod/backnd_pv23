const winston = require('winston');
const { format, transports } = winston;
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

/**
 * Sistema de Logs Mejorado para PuraVida E-commerce
 * 
 * Características:
 * - Formato humanizado para fácil lectura
 * - Rotación diaria de archivos para mantenimiento sencillo
 * - Compresión automática de logs antiguos
 * - Niveles de log con colores para mejor identificación
 * - Retención configurable (14 días debug, 30 días errores)
 */

// Crear directorio de logs si no existe
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Formato personalizado para logs en consola con colores
const consoleFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.colorize({ all: true }),
  format.printf(({ level, message, timestamp, ...metadata }) => {
    let metaStr = '';
    
    if (metadata.component) {
      metaStr += `[${metadata.component}]`;
      
      if (metadata.operation) {
        metaStr += `.${metadata.operation}`;
      }
      
      metaStr += ' ';
    }
    
    // Formatear requestId si existe
    if (metadata.requestId) {
      metaStr += `reqId:${metadata.requestId.substring(0, 8)} `;
    }
    
    // Formatear información de error
    if (metadata.error) {
      metaStr += `error:"${metadata.error}" `;
    }
    
    // Añadir otros metadatos relevantes
    if (metadata.user) {
      metaStr += `user:${metadata.user} `;
    }
    
    // Añadir métricas si están disponibles
    if (metadata.metrics) {
      const metrics = Object.entries(metadata.metrics)
        .map(([key, value]) => `${key}:${value}`)
        .join(' ');
      
      if (metrics) {
        metaStr += `metrics:{${metrics}} `;
      }
    }
    
    // Otros metadatos que no son especiales
    const otherMetadata = { ...metadata };
    delete otherMetadata.component;
    delete otherMetadata.operation;
    delete otherMetadata.requestId;
    delete otherMetadata.error;
    delete otherMetadata.stack;
    delete otherMetadata.user;
    delete otherMetadata.metrics;
    
    if (Object.keys(otherMetadata).length > 0) {
      const formatted = JSON.stringify(otherMetadata)
        .replace(/"([^"]+)":/g, '$1:')
        .replace(/[{}"]/g, '');
      
      if (formatted && formatted !== '{}') {
        metaStr += formatted;
      }
    }
    
    return `${timestamp} ${level}: ${metaStr}${message}`;
  })
);

// Formato para logs en archivos (sin colores, más detallado)
const fileFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.uncolorize(),
  format.printf(info => {
    const { level, message, timestamp, ...metadata } = info;
    return JSON.stringify({
      time: timestamp,
      level,
      message,
      ...metadata
    });
  })
);

// Configuración de transports
const logConfiguration = {
  exitOnError: false,
  level: process.env.LOG_LEVEL || 'info',
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
    silly: 5
  },
  transports: [
    // Salida a consola
    new transports.Console({
      format: consoleFormat
    }),
    
    // Archivos de logs diarios para diferentes niveles
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '14d'
    }),
    
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '7d'
    }),
    
    new DailyRotateFile({
      filename: path.join(logDir, 'debug-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'debug',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '3d'
    })
  ]
};

// Crear el logger
const logger = winston.createLogger(logConfiguration);

// Funciones helper para logging estructurado
logger.logRequest = (req, res, responseTime) => {
  const { method, originalUrl, ip, id: requestId, user } = req;
  
  logger.http(`${method} ${originalUrl} ${res.statusCode} ${responseTime}ms`, {
    component: 'http',
    method,
    url: originalUrl,
    status: res.statusCode,
    responseTime,
    ip,
    requestId,
    userId: user?.id
  });
};

logger.logAPI = (req, message, metadata = {}) => {
  logger.info(message, {
    component: 'api',
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
    ...metadata
  });
};

logger.logError = (error, context = {}) => {
  logger.error(error.message || 'Error desconocido', {
    component: context.component || 'app',
    operation: context.operation,
    error: error.message,
    stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    ...context
  });
};

logger.logMetric = (name, value, tags = {}) => {
  logger.info(`Métrica: ${name}=${value}`, {
    component: 'metrics',
    metricName: name,
    metricValue: value,
    ...tags
  });
};

// Middleware para Express para loggear peticiones HTTP
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Asignar un ID único a cada petición
  req.id = req.id || require('crypto').randomUUID();
  
  // Loggear al terminar la respuesta
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);
  });
  
  next();
};

module.exports = {
  logger,
  requestLogger
}; 