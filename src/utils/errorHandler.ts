import {  logger  } from '../configs/logger';

// Clase base para errores de la aplicación
class AppError extends Error {
  constructor(message, statusCode, errorCode = null, context = {}) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode || `ERR_${statusCode}`;
    this.context = context;
    this.isOperational = true; // Errores operacionales son controlados
    Error.captureStackTrace(this, this.constructor);
  }
}

// Errores específicos
class BadRequestError extends AppError {
  constructor(message = 'Solicitud incorrecta', errorCode = null, context = {}) {
    super(message, 400, errorCode || 'ERR_BAD_REQUEST', context);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado', errorCode = null, context = {}) {
    super(message, 401, errorCode || 'ERR_UNAUTHORIZED', context);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Acceso prohibido', errorCode = null, context = {}) {
    super(message, 403, errorCode || 'ERR_FORBIDDEN', context);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado', errorCode = null, context = {}) {
    super(message, 404, errorCode || 'ERR_NOT_FOUND', context);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflicto con el estado actual', errorCode = null, context = {}) {
    super(message, 409, errorCode || 'ERR_CONFLICT', context);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Error de validación', errors = [], context = {}) {
    super(message, 422, 'ERR_VALIDATION', { ...context, errors });
    this.errors = errors;
  }
}

class InternalServerError extends AppError {
  constructor(message = 'Error interno del servidor', errorCode = null, context = {}) {
    super(message, 500, errorCode || 'ERR_INTERNAL', context);
    this.isOperational = false; // Errores internos no son operacionales
  }
}

// Manejador global de errores
const handleError = (err, req = null, res = null) => {
  // Si es un error de la aplicación, lo logueamos apropiadamente
  if (err instanceof AppError) {
    const level = err.statusCode >= 500 ? 'error' : err.statusCode >= 400 ? 'warn' : 'info';
    const context = {
      errorCode: err.errorCode,
      statusCode: err.statusCode,
      isOperational: err.isOperational,
      ...err.context
    };
    
    if (req) {
      // Agregar información de la solicitud si está disponible
      context.request = {
        id: req.id,
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        userId: req.user?.id || 'anonymous'
      };
    }
    
    if (level === 'error') {
      logger.error(err.message, {
        component: 'error',
        ...context,
        stack: err.stack
      });
    } else if (level === 'warn') {
      logger.warn(err.message, {
        component: 'error',
        ...context,
        stack: err.stack
      });
    } else {
      logger.info(err.message, {
        component: 'error',
        ...context,
        stack: err.stack
      });
    }
  } else {
    // Si es un error inesperado, lo tratamos como error crítico
    const context = req ? {
      request: {
        id: req?.id,
        method: req?.method,
        url: req?.originalUrl || req?.url,
        ip: req?.ip || req?.headers['x-forwarded-for'],
        userAgent: req?.headers['user-agent']
      }
    } : {};
    
    logger.error(err.message || 'Error inesperado', { 
      component: 'error',
      ...context,
      stack: err.stack,
      isCritical: true
    });
  }
  
  // Si tenemos una respuesta, enviamos el error apropiado
  if (res && !res.headersSent) {
    const statusCode = err.statusCode || 500;
    
    const errorResponse = {
      success: false,
      error: {
        message: err.message || 'Error interno del servidor',
        code: err.errorCode || `ERR_${statusCode}`
      }
    };
    
    // Solo enviamos detalles adicionales en desarrollo
    if (process.env.NODE_ENV === 'development') {
      errorResponse.error.stack = err.stack;
      if (err.errors) {
        errorResponse.error.details = err.errors;
      }
    }
    
    res.status(statusCode).json(errorResponse);
  }
  
  // Si es un error crítico no operacional, podríamos querer finalizar el proceso
  if (err.isOperational === false && process.env.NODE_ENV === 'production') {
    // En producción, dependiendo de la gravedad, podríamos considerar reiniciar el proceso
    // Sin embargo, esto depende de la arquitectura y la estrategia de despliegue
    logger.error('⚠️ ERROR CRÍTICO NO OPERACIONAL - Considerar reinicio del proceso', {
      component: 'error',
      message: err.message,
      stack: err.stack
    });
  }
};

// Middleware para manejo centralizado de errores Express
const errorMiddleware = (err, req, res, next) => {
  handleError(err, req, res);
  // No llamamos a next() para terminar el ciclo de manejo de errores
};

// Capturar excepciones no manejadas
process.on('uncaughtException', (err) => {
  logger.error('⚠️ EXCEPCIÓN NO MANEJADA', { 
    component: 'process',
    operation: 'uncaughtException',
    message: err.message, 
    stack: err.stack 
  });
  // En producción, reiniciamos el proceso de forma segura
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Capturar promesas rechazadas no manejadas
process.on('unhandledRejection', (reason, promise) => {
  const errorMessage = reason instanceof Error ? reason.message : String(reason);
  const errorStack = reason instanceof Error ? reason.stack : 'No disponible';
  
  console.error('⚠️ PROMESA RECHAZADA NO MANEJADA:', errorMessage);
  console.error('Stack:', errorStack);
  
  // En producción, convertimos en excepción para que sea manejada por uncaughtException
  if (process.env.NODE_ENV === 'production') {
    throw reason;
  }
});

export {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
  handleError,
  errorMiddleware
}; 