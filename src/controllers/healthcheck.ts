/**
 * Controlador para verificaciones de estado (healthchecks)
 * Proporciona endpoints para monitorear la salud del sistema
 */

import sequelize from '../configs/database';
import {  logger  } from '../configs/logger';
import os from 'os';
import {  version  } from '../../package.json';
import { Request, Response } from 'express';


// Tiempo de inicio de la aplicación
const startTime = Date.now();

/**
 * Controlador para endpoints de monitoreo de salud
 * Estos endpoints proporcionan información vital sobre el estado del sistema
 * para monitoreo operacional y alertas.
 */

/**
 * Obtiene el estado general del servicio, incluyendo todas las dependencias
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const getStatus = async (req: Request, res: Response) => {
    try {
        const serviceStatus = {
            service: 'PuraVida Backend API',
            status: 'operational',
            timestamp: new Date().toISOString(),
            uptime: formatUptime(process.uptime()),
            dependencies: {
                database: {
                    status: 'unknown',
                    details: null
                }
            }
        };

        // Verificar conexión a la base de datos
        try {
            await sequelize.authenticate();
            serviceStatus.dependencies.database.status = 'operational';
        } catch (dbError) {
            serviceStatus.status = 'degraded';
            serviceStatus.dependencies.database.status = 'down';
            serviceStatus.dependencies.database.details = dbError.message;
            
            console.error('Error de conexión a la base de datos durante health check:', dbError.message);
        }

        // Establecer código de estado según el estado del servicio
        const statusCode = serviceStatus.status === 'operational' ? 200 : 
                          serviceStatus.status === 'degraded' ? 200 : 500;

        // Registrar el resultado del health check (usando console para evitar dependencias del logger)
        console.info('Health check completado:', serviceStatus.status);

        return res.status(statusCode).json(serviceStatus);
    } catch (error) {
        console.error('Error al verificar el estado del servicio:', error.message);
        
        return res.status(500).json({
            service: 'PuraVida Backend API',
            status: 'critical',
            timestamp: new Date().toISOString(),
            error: 'Error interno al verificar el estado'
        });
    }
};

/**
 * Verificación rápida para confirmar que el servicio está respondiendo
 * Útil para comprobaciones de Kubernetes/contenedores
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const getLiveness = (req: Request, res: Response) => {
    logger.debug('Liveness check solicitado', {
        component: 'healthcheck',
        operation: 'getLiveness',
        requestId: req.id
    });
    
    return res.status(200).json({
        service: 'PuraVida Backend API',
        status: 'alive',
        timestamp: new Date().toISOString()
    });
};

/**
 * Verifica que el servicio esté listo para recibir tráfico
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const getReadiness = async (req: Request, res: Response) => {
    try {
        await sequelize.authenticate();
        
        logger.debug('Readiness check exitoso', {
            component: 'healthcheck',
            operation: 'getReadiness',
            requestId: req.id
        });
        
        return res.status(200).json({
            service: 'PuraVida Backend API',
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.warn('Servicio no está listo - Problema con la base de datos', {
            component: 'healthcheck',
            operation: 'getReadiness',
            error: error.message,
            requestId: req.id
        });
        
        return res.status(503).json({
            service: 'PuraVida Backend API',
            status: 'not_ready',
            details: 'Database connection issues',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Proporciona métricas detalladas del sistema para monitoreo
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const getMetrics = (req: Request, res: Response) => {
    // Recopilación de métricas del sistema
    const memoryUsage = process.memoryUsage();
    const systemInfo = {
        os: {
            platform: os.platform(),
            release: os.release(),
            hostname: os.hostname(),
            type: os.type(),
            arch: os.arch(),
            cpus: os.cpus().length,
            loadAvg: os.loadavg().map(load => load.toFixed(2)),
            freeMemory: formatBytes(os.freemem()),
            totalMemory: formatBytes(os.totalmem()),
            usedMemoryPercentage: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(1) + '%'
        },
        process: {
            uptime: formatUptime(process.uptime()),
            startedAt: new Date(startTime).toISOString(),
            nodeVersion: process.version,
            pid: process.pid,
            memory: {
                rss: formatBytes(memoryUsage.rss),
                heapTotal: formatBytes(memoryUsage.heapTotal),
                heapUsed: formatBytes(memoryUsage.heapUsed),
                external: formatBytes(memoryUsage.external),
                heapUsedPercentage: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(1) + '%'
            }
        }
    };

    // Detalles extendidos solo en desarrollo
    if (process.env.NODE_ENV !== 'production') {
        systemInfo.env = process.env.NODE_ENV;
        systemInfo.process.resourceUsage = process.resourceUsage();
        systemInfo.process.memoryUsageDetails = process.memoryUsage();
    }

    logger.info('Métricas del sistema solicitadas', {
        component: 'healthcheck',
        operation: 'getMetrics',
        metrics: {
            cpuCount: systemInfo.os.cpus,
            loadAvg: systemInfo.os.loadAvg[0],
            memoryUsedPercent: systemInfo.os.usedMemoryPercentage,
            heapUsedPercent: systemInfo.process.memory.heapUsedPercentage,
            uptime: systemInfo.process.uptime
        },
        requestId: req.id
    });

    return res.status(200).json({
        service: 'PuraVida Backend API',
        timestamp: new Date().toISOString(),
        metrics: systemInfo
    });
};

/**
 * Formatea bytes a una representación legible
 * @param {Number} bytes - Tamaño en bytes
 * @returns {String} Representación formateada
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Formatea segundos a una representación legible de tiempo
 * @param {Number} seconds - Tiempo en segundos
 * @returns {String} Representación formateada
 */
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    
    return parts.join(' ');
}

export {
    getStatus,
    getLiveness,
    getReadiness,
    getMetrics
}; 