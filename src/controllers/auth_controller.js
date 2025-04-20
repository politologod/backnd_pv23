const User = require("../models/model_user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { BadRequestError, UnauthorizedError } = require("../utils/errorHandler");

// 🔹 Generar token JWT con más información útil pero excluyendo datos sensibles
const createToken = (user) => {
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
	const jwtOptions = {
		expiresIn: process.env.JWT_EXPIRATION || '1d',
		algorithm: "HS256"
	};
	
	// Añadir issuer y audience solo en producción, evitando undefined
	if (process.env.NODE_ENV === 'production') {
		jwtOptions.issuer = "puravida-api";
		jwtOptions.audience = "puravida-client";
	}
	
	return jwt.sign(
		payload,
		process.env.JWT_SECRET,
		jwtOptions
	);
};

// Configuración de cookie segura
const secureCookieConfig = {
	httpOnly: true, 
	secure: process.env.NODE_ENV === "production",
	sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", 
	maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
	path: "/",
	domain: process.env.COOKIE_DOMAIN || "localhost"
};

// 🔹 Registro con email y contraseña
const register = async (req, res) => {
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
			if (req.user && req.user.role === 'admin') {
				userRole = role;
				console.info('Admin creando usuario con rol específico', { 
					createdBy: req.user.id, 
					newUserEmail: email, 
					assignedRole: role 
				});
			} else {
				console.warn('Intento de crear usuario con rol privilegiado sin permisos', { 
					requestedRole: role,
					requesterRole: req.user?.role || 'anonymous'
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
			role: userRole
		});

		console.debug('Usuario creado con éxito', { 
			userId: user.id, 
			email: user.email,
			role: user.role
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
		console.error('Error en registro', { error: error.message });
		
		if (error instanceof BadRequestError) {
			return res.status(400).json({ message: error.message });
		}
		
		res.status(500).json({ message: 'Error al registrar usuario' });
	}
};

// 🔹 Inicio de sesión con email y contraseña
const login = async (req, res) => {
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
		console.error('Error en login', { error: error.message });
		
		if (error instanceof BadRequestError || error instanceof UnauthorizedError) {
			return res.status(error instanceof BadRequestError ? 400 : 401).json({ message: error.message });
		}
		
		res.status(500).json({ message: 'Error al iniciar sesión' });
	}
};

// 🔹 Cerrar sesión
const logout = (req, res) => {
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
		console.error('Error en logout', { error: error.message });
		res.status(500).json({ message: 'Error al cerrar sesión' });
	}
};

const verifyToken = (req, res, next) => {
	const token = req.cookies["token"];
	if (!token) {
		return res.status(401).json({ message: "No se proporcionó token" });
	}

	try {
		// Opciones de verificación de JWT
		const verifyOptions = {
			algorithms: ["HS256"]
		};
		
		// Añadir issuer y audience solo en producción
		if (process.env.NODE_ENV === 'production') {
			verifyOptions.issuer = "puravida-api";
			verifyOptions.audience = "puravida-client";
		}
		
		const decoded = jwt.verify(
			token,
			process.env.JWT_SECRET,
			verifyOptions
		);
		
		// Verificar tiempo de expiración
		const currentTime = Math.floor(Date.now() / 1000);
		if (decoded.exp <= currentTime) {
			return res.status(401).json({ message: "Token expirado" });
		}
		
		// Guarda la información decodificada para usarla en otras rutas
		req.user = decoded;
		next();
	} catch (err) {
		console.warn("Token inválido en verificación", { error: err.message });
		return res.status(401).json({ message: "Token inválido" });
	}
}

module.exports = {
	register,
	login,
	logout,
	verifyToken
};
