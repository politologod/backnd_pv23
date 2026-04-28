import jwt from 'jsonwebtoken';
// Reemplazamos logger por console directamente
// import logger from '../configs/logger';
import {  UnauthorizedError, ForbiddenError  } from '../utils/errorHandler';

const auth = (req, res, next) => {
    try {
        // Obtener el token de la cookie
        const token = req.cookies.token;

        if (!token) {
            throw new UnauthorizedError('No se proporcionó token de autenticación');
        }

        // Opciones de verificación de JWT
        const verifyOptions = {
            algorithms: ["HS256"],
            ignoreExpiration: false
        };
        
        // Añadir issuer y audience solo en producción
        if (process.env.NODE_ENV === 'production') {
            verifyOptions.issuer = "puravida-api";
            verifyOptions.audience = "puravida-client";
        }

        // Verificar el token con opciones de seguridad
        const decoded = jwt.verify(token, process.env.JWT_SECRET, verifyOptions);
        
        // Verificar la expiración manualmente como capa adicional de seguridad
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp <= currentTime) {
            throw new UnauthorizedError('Token expirado');
        }
        
        // Agregar el usuario decodificado a la solicitud
        req.user = decoded;
        next();
    } catch (error) {
        console.warn('Error de autenticación', { 
            error: error.message,
            path: req.path,
            ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
        });
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado. Por favor, inicie sesión nuevamente.' });
        }
        
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

// Middleware más robusto para verificación de roles
const checkRole = (roles) => {
    return (req, res, next) => {
        try {
            // Depuración - Registrar el usuario y roles requeridos
            console.debug('Verificando roles de usuario', {
                user: req.user,
                requiredRoles: roles
            });

            // Asegurar que el usuario existe y tiene un rol válido
            if (!req.user) {
                throw new UnauthorizedError('Usuario no autenticado');
            }
            
            // Depuración - Verificar el rol específico
            console.debug('Comparando roles', {
                userRole: req.user.role,
                userRoleType: typeof req.user.role,
                requiredRoles: roles,
                hasPermission: req.user.role && roles.includes(req.user.role)
            });
            
            if (!req.user.role || !roles.includes(req.user.role)) {
                // Registrar intento de acceso no autorizado
                console.warn('Intento de acceso no autorizado', {
                    userId: req.user.id,
                    requiredRoles: roles,
                    userRole: req.user.role,
                    path: req.originalUrl,
                    method: req.method,
                    ip: req.ip || req.headers['x-forwarded-for']
                });
                
                throw new ForbiddenError('No tienes permisos para acceder a esta ruta');
            }
            
            console.debug('Acceso autorizado', {
                userId: req.user.id,
                userRole: req.user.role,
                path: req.originalUrl
            });
            
            next();
        } catch (error) {
            console.error('Error en verificación de roles', {
                error: error.message,
                stack: error.stack
            });
            
            if (error instanceof UnauthorizedError) {
                return res.status(401).json({ message: error.message });
            }
            
            return res.status(403).json({ message: error.message || 'No tienes permisos para acceder a esta ruta' });
        }
    };
};

// Middleware para prevenir CSRF
const csrfProtection = (req, res, next) => {
    // En desarrollo, permitir todas las solicitudes
    if (process.env.NODE_ENV !== 'production') {
        return next();
    }
    
    // Verificar el origen de la solicitud
    const origin = req.headers.origin;
    const referer = req.headers.referer;
    
    // En producción, verificar que las solicitudes vengan de orígenes permitidos
    const allowedOrigins = [process.env.FRONTEND_URL, process.env.ADMIN_URL]; // Agregar más orígenes permitidos según sea necesario
    
    if (origin && !allowedOrigins.includes(origin)) {
        console.warn('Posible ataque CSRF detectado', {
            origin,
            referer,
            ip: req.ip,
            path: req.originalUrl,
            method: req.method
        });
        
        return res.status(403).json({ message: 'Solicitud rechazada por motivos de seguridad' });
    }
    
    next();
};

export { auth, checkRole, csrfProtection }; 