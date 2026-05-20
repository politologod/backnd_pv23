import User from '../models/model_user';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {  BadRequestError, UnauthorizedError  } from '../utils/errorHandler';
import crypto from 'crypto';
import EmailNotificationService from '../services/emailNotificationService';
import {  logger  } from '../configs/logger';
import {  Op  } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';


// 🔹 Generar token JWT con más información útil pero excluyendo datos sensibles
const createToken = (user: any) => {
	// Función de ayuda para convertir a objeto si no lo es
	const userObj = typeof user.toObject === 'function' ? user.toObject() : user;
	
	// Verificar que el objeto de usuario tenga las propiedades esperadas
	// Esto es crítico para asegurar que el token tiene la estructura correcta
	const payload = {
		id: userObj.id || userObj.id_autoincrement, // Compatibilidad con diferentes modelos
		email: userObj.email,
		name: userObj.name,
		role: userObj.role // Asegurar que el rol esté incluido
	};
	
	// Registrar información sobre el token (sin datos sensibles)
	console.debug('Creando token JWT', {
		payload: { ...payload, id: '***', email: '***' } // No mostrar datos sensibles en logs
	});
	
	// Configuración JWT con valores adecuados
	const jwtOptions: any = {
		expiresIn: process.env.JWT_EXPIRATION || '1d',
		algorithm: "HS256"
	};
	
	// Añadir issuer y audience solo en producción, evitando undefined
	if (process.env.NODE_ENV === 'production') {
		jwtOptions.issuer = process.env.JWT_ISSUER || "ecommerce-api";
		jwtOptions.audience = process.env.JWT_AUDIENCE || "ecommerce-client";
	}
	
	return jwt.sign(
		payload,
		process.env.JWT_SECRET as string,
		jwtOptions
	);
};

// Configuración de cookie segura
const secureCookieConfig: any = {
	httpOnly: true, 
	secure: process.env.NODE_ENV === "production",
	sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", 
	maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
	path: "/",
	domain: process.env.COOKIE_DOMAIN || "localhost"
};

// 🔹 Registro con email y contraseña
const register = async (req: Request, res: Response) => {
	try {
		const { email, password, name, role } = req.body;

		// Validación básica
		if (!email || !password || !name) {
			throw new BadRequestError('Todos los campos son requeridos');
		}

		// Validación de contraseña más estricta en producción
		if (process.env.NODE_ENV === 'production') {
			const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
			if (!passwordRegex.test(password)) {
				throw new BadRequestError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial');
			}
		}

		// Verificar si el usuario ya existe - usando findOne específico para el modelo actual
		const existingUser = await User.findOne({ where: { email } });
		if (existingUser) {
			throw new BadRequestError('El correo electrónico ya está registrado');
		}

		// Determinar rol - Lógica unificada de roles:
		// 1. Si el usuario que hace la petición es admin, puede crear cualquier tipo de usuario
		// 2. Si no hay usuario autenticado o no es admin, solo puede crear usuarios customer
		let userRole = 'customer'; // Por defecto, todos los usuarios son customer
		
		if (role && role !== 'customer') {
			// Sólo un admin puede crear usuarios con roles distintos a customer
			if ((req as any).user && (req as any).user.role === 'admin') {
				userRole = role;
				console.info('Admin creando usuario con rol específico', { 
					createdBy: (req as any).user.id, 
					newUserEmail: email, 
					assignedRole: role 
				});
			} else {
				console.warn('Intento de crear usuario con rol privilegiado sin permisos', { 
					requestedRole: role,
					requesterRole: (req as any).user?.role || 'anonymous'
				});
				// No permitir crear roles privilegiados, pero no dar error (silenciosamente asignar customer)
			}
		}

		console.debug('Creando usuario con rol', { email, assignedRole: userRole });

		// Crear nuevo usuario - usando el método create específico para el modelo actual
		const user = await User.create({
			email,
			password,
			name,
			role: userRole as any
		});

		console.debug('Usuario creado con éxito', { 
			userId: user.id, 
			email: user.email,
			role: user.role
		});

		// Enviar correo de bienvenida (asíncrono, no bloquea la respuesta)
		EmailNotificationService.sendWelcomeEmail(user.id)
			.then(emailSent => {
				if (!emailSent) {
					logger.warn('No se pudo enviar correo de bienvenida', { userId: user.id });
				}
			})
			.catch(err => {
				logger.error('Error al enviar correo de bienvenida', { userId: user.id, error: err.message });
			});

		// Generar token
		const token = createToken(user);

		// Configurar cookie segura
		res.cookie('token', token, secureCookieConfig);

		res.status(201).json({
			message: 'Usuario registrado exitosamente',
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role
			}
		});
	} catch (error) {
		console.error('Error en registro', { error: (error as Error).message });
		
		if (error instanceof BadRequestError) {
			return res.status(400).json({ message: error.message });
		}
		
		res.status(500).json({ message: 'Error al registrar usuario' });
	}
};

// 🔹 Inicio de sesión con email y contraseña
const login = async (req: Request, res: Response) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			throw new BadRequestError('Email y contraseña son requeridos');
		}

		// Buscar usuario - usando findOne específico para el modelo actual
		const user = await User.findOne({ where: { email } });
		if (!user) {
			throw new UnauthorizedError('Credenciales inválidas');
		}

		// Verificar contraseña usando comparación segura contra timing attacks
		const isValidPassword = await bcrypt.compare(password, user.password);
		if (!isValidPassword) {
			throw new UnauthorizedError('Credenciales inválidas');
		}

		console.debug('Usuario autenticado correctamente', { 
			userId: user.id, 
			email: user.email, 
			role: user.role
		});

		// Generar token
		const token = createToken(user);

		console.debug('Token generado', { 
			userId: user.id,
			tokenInfo: {
				role: user.role,
				// No incluir el token completo en los logs por seguridad
				exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // Aprox 1 día 
			}
		});

		// Configurar cookie segura
		res.cookie('token', token, secureCookieConfig);

		res.json({
			message: 'Login exitoso',
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role
			}
		});
	} catch (error) {
		console.error('Error en login', { error: (error as Error).message });
		
		if (error instanceof BadRequestError || error instanceof UnauthorizedError) {
			return res.status(error instanceof BadRequestError ? 400 : 401).json({ message: error.message });
		}
		
		res.status(500).json({ message: 'Error al iniciar sesión' });
	}
};

// 🔹 Cerrar sesión
const logout = (req: Request, res: Response) => {
	try {
		// Limpiar cookie
		res.clearCookie('token', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
			path: "/",
			domain: process.env.COOKIE_DOMAIN || "localhost"
		});
		
		res.json({ message: 'Sesión cerrada exitosamente' });
	} catch (error) {
		console.error('Error en logout', { error: (error as Error).message });
		res.status(500).json({ message: 'Error al cerrar sesión' });
	}
};

const verifyToken = (req: Request, res: Response) => {
	const token = req.cookies.token;
  
	if (!token) {
	  return res.json({ authenticated: false, user: null });
	}
  
	jwt.verify(token, process.env.JWT_SECRET as string, async (err, decoded) => {
	  if (err) {
		return res.json({ authenticated: false, user: null });
	  }
  
	  try {
		const user = await User.findByPk((decoded as any).id, {
		  attributes: ['id', 'email', 'role'],
		});
  
		if (!user) {
		  return res.json({ authenticated: false, user: null });
		}
  
		res.json({ authenticated: true, user });
	  } catch (err) {
		res.status(500).json({ error: 'Internal error' });
	  }
	});
};

/**
 * Maneja la solicitud de restablecimiento de contraseña
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @returns {Object} - Respuesta JSON
 */
const requestPasswordReset = async (req: Request, res: Response) => {
	try {
		const { email } = req.body;
		
		if (!email) {
			return res.status(400).json({ 
				success: false, 
				message: 'El correo electrónico es requerido' 
			});
		}
		
		// Buscar usuario por email
		const user = await User.findOne({ where: { email } });
		
		// Si el usuario existe, generar token de restablecimiento
		if (user) {
			// Generar token aleatorio
			const resetToken = crypto.randomBytes(32).toString('hex');
			
			// Establecer expiración (1 hora)
			const resetTokenExpiration = new Date();
			resetTokenExpiration.setHours(resetTokenExpiration.getHours() + 1);
			
			// Actualizar usuario con token
			await user.update({
				resetPasswordToken: resetToken,
				resetPasswordExpires: resetTokenExpiration
			});
			
			// Enviar correo con instrucciones
			await EmailNotificationService.sendPasswordResetEmail(user, resetToken);
			
			logger.info('Solicitud de restablecimiento de contraseña procesada', { email });
		}
		
		// Siempre devolver success para no revelar si el email existe
		return res.status(200).json({
			success: true,
			message: 'Si la dirección de correo está registrada, recibirás un email con instrucciones para restablecer tu contraseña'
		});
	} catch (error) {
		logger.error('Error al procesar solicitud de restablecimiento de contraseña', { error: (error as Error).message });
		return res.status(500).json({
			success: false,
			message: 'Error al procesar la solicitud. Por favor, inténtalo más tarde.'
		});
	}
};

/**
 * Maneja el restablecimiento de contraseña con token
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @returns {Object} - Respuesta JSON
 */
const resetPassword = async (req: Request, res: Response) => {
	try {
		const { token, newPassword } = req.body;
		
		if (!token || !newPassword) {
			return res.status(400).json({ 
				success: false, 
				message: 'Token y nueva contraseña son requeridos' 
			});
		}
		
		// Buscar usuario con token válido y no expirado
		const user = await User.findOne({ 
			where: { 
				resetPasswordToken: token,
				resetPasswordExpires: { 
					[Op.gt]: new Date() // Token no expirado (fecha mayor a la actual)
				}
			} 
		});
		
		if (!user) {
			return res.status(400).json({ 
				success: false, 
				message: 'El token es inválido o ha expirado' 
			});
		}
		
		// Encriptar nueva contraseña
		const hashedPassword = await bcrypt.hash(newPassword, 10);
		
		// Actualizar usuario
		await user.update({
			password: hashedPassword,
			resetPasswordToken: null,
			resetPasswordExpires: null
		});
		
		// Enviar correo de confirmación
		await EmailNotificationService.sendPasswordChangedConfirmationEmail(user);
		
		logger.info('Contraseña restablecida correctamente', { userId: user.id });
		
		return res.status(200).json({
			success: true,
			message: 'Tu contraseña ha sido actualizada correctamente'
		});
	} catch (error) {
		logger.error('Error al restablecer contraseña', { error: (error as Error).message });
		return res.status(500).json({
			success: false,
			message: 'Error al restablecer la contraseña. Por favor, inténtalo más tarde.'
		});
	}
};

// 🔹 Refrescar token JWT
const refreshToken = async (req: Request, res: Response) => {
	try {
		const token = req.cookies.token;

		if (!token) {
			return res.status(401).json({ message: 'No token provided' });
		}

		let decoded;
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET as string);
		} catch (err) {
			return res.status(401).json({ message: 'Token inválido o expirado' });
		}

		const user = await User.findByPk((decoded as any).id);

		if (!user) {
			return res.status(401).json({ message: 'Usuario no encontrado' });
		}

		// Generar nuevo token
		const newToken = createToken(user);

		// Configurar cookie segura
		res.cookie('token', newToken, secureCookieConfig);

		return res.json({
			message: 'Token refreshed',
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role
			}
		});
	} catch (error) {
		console.error('Error al refrescar token', { error: (error as Error).message });
		return res.status(500).json({ message: 'Error al refrescar token' });
	}
};

export {
	register,
	login,
	logout,
	verifyToken,
	requestPasswordReset,
	resetPassword,
	refreshToken
};
