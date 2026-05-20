import logger from '../configs/logger';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';


/**
 * Middleware para registrar todas las solicitudes HTTP entrantes
 * y sus respuestas correspondientes.
 */
const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  // Generar un ID único para cada solicitud
  (req as any).id = (req as any).id || uuidv4();
  
  // Agregar el ID de solicitud a los encabezados de respuesta
  res.setHeader('X-Request-ID', (req as any).id);
  
  // Capturar información de la solicitud
  const requestInfo = {
    id: (req as any).id,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || (req as any).connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?.id || 'anónimo'
  };
  
  // Formatear detalles de la solicitud para el log
  const requestMessage = `${req.method} ${req.originalUrl || req.url}`;
  
  // Registrar la solicitud
  logger.http(requestMessage, {
    request: requestInfo,
    type: 'REQUEST_RECEIVED'
  });
  
  // Capturar el tiempo de inicio
  const startTime = Date.now();
  
  // Interceptar el método end para capturar información de la respuesta
  const originalEnd = res.end;
  res.end = function(chunk: any, encoding: any) {
    // Restaurar el método end original
    res.end = originalEnd;
    
    // Ejecutar el método end original
    res.end(chunk, encoding);
    
    // Calcular el tiempo de respuesta
    const responseTime = Date.now() - startTime;
    
    // Capturar información de la respuesta
    const responseInfo = {
      statusCode: res.statusCode,
      responseTime,
    };
    
    // Formatear detalles de la respuesta para el log
    const responseMessage = `${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${responseTime}ms`;
    
    // Determinar el nivel de log según el código de estado
    let level = 'http';
    
    if (res.statusCode >= 500) {
      level = 'error';
    } else if (res.statusCode >= 400) {
      level = 'warn';
    }
    
    // Registrar la respuesta con la misma información de solicitud para contexto
    logger.log(level, responseMessage, {
      request: requestInfo,
      response: responseInfo,
      type: 'REQUEST_COMPLETED'
    });
  } as any;
  
  next();
};
