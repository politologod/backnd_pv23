const express = require("express");
const cors = require("cors");
const passport = require("passport");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const db = require("./models");
const sequelize = db.sequelize;
const logger = require("./configs/logger");
const { requestLogger, errorLogger, requestContextLogger } = require("./middlewares/logger.middleware");
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { csrfProtection } = require('./middlewares/auth');

const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./configs/swagger");
const morgan = require("morgan");

const app = express();

// Middlewares de seguridad - Configuración más flexible para desarrollo
if (process.env.NODE_ENV === 'production') {
	// Configuración estricta solo en producción
	app.use(helmet({
		contentSecurityPolicy: true,
		crossOriginEmbedderPolicy: true,
		crossOriginOpenerPolicy: true,
		crossOriginResourcePolicy: { policy: "same-site" },
		dnsPrefetchControl: true,
		frameguard: { action: "deny" },
		hidePoweredBy: true,
		hsts: {
			maxAge: 15552000,
			includeSubDomains: true
		},
		ieNoOpen: true,
		noSniff: true,
		referrerPolicy: { policy: "strict-origin-when-cross-origin" },
		xssFilter: true
	}));
} else {
	// Configuración básica para desarrollo
	app.use(helmet({
		contentSecurityPolicy: false,
		crossOriginEmbedderPolicy: false,
		crossOriginOpenerPolicy: false,
		crossOriginResourcePolicy: false,
		dnsPrefetchControl: false,
		frameguard: false,
		hidePoweredBy: false,
		hsts: false,
		ieNoOpen: false,
		noSniff: false,
		referrerPolicy: false,
		xssFilter: false
	}));
}

// Protección contra ataques de fuerza bruta - Solo en producción
if (process.env.NODE_ENV === 'production') {
	const generalLimiter = rateLimit({
		windowMs: 15 * 60 * 1000,
		max: 100,
		standardHeaders: true,
		legacyHeaders: false,
		message: 'Demasiadas solicitudes, por favor intenta más tarde'
	});

	const authLimiter = rateLimit({
		windowMs: 15 * 60 * 1000,
		max: 5,
		standardHeaders: true,
		legacyHeaders: false,
		message: 'Demasiados intentos de acceso, por favor intenta más tarde'
	});

	app.use(generalLimiter);
	app.use("/api/auth/login", authLimiter);
	app.use("/api/auth/register", authLimiter);
}

// Middlewares
app.use(requestContextLogger);
app.use(requestLogger);
app.use(morgan("dev"));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(compression());

// Configuración de CORS más permisiva para desarrollo
const corsOptions = {
	origin: function(origin, callback) {
		// Para desarrollo o cuando se usa ngrok, ser más permisivo
		const isNgrok = process.env.USING_NGROK === 'true';
		
		// Cuando se usa ngrok, aceptar todos los orígenes
		if (isNgrok) {
			return callback(null, true);
		}
		
		const allowedOrigins = [
			process.env.FRONTEND_URL,
			process.env.ADMIN_URL,
			'http://localhost:3000',
			'http://localhost:3001',
			'https://puravida-admin-kappa.vercel.app',
			'https://v0-puravida-23-ecommerce-7l.vercel.app'
		].filter(Boolean);

		// Permitir solicitudes sin origen (como aplicaciones móviles o curl)
		if (!origin) return callback(null, true);

		if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
			callback(null, true);
		} else {
			console.warn('Origen rechazado por CORS:', origin);
			callback(new Error('No permitido por CORS'));
		}
	},
	credentials: true,
	allowedHeaders: [
		"Content-Type",
		"Authorization",
		"X-Requested-With",
		"Accept",
		"Origin",
		"X-CSRF-Token"
	],
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
	maxAge: 3600,
	exposedHeaders: ["Content-Range", "X-Content-Range"]
};
app.use(cors(corsOptions));

// Configuración de Passport
require("./configs/passport")(passport);
app.use(passport.initialize());

// CSRF Protection - Solo en producción
if (process.env.NODE_ENV === 'production') {
	app.use('/api/auth/*', csrfProtection);
	app.use('/api/users/*', csrfProtection);
	app.use('/api/orders/*', csrfProtection);
	app.use('/api/products/*', csrfProtection);
	app.use('/api/categories/*', csrfProtection);
	app.use('/api/cart/*', csrfProtection);
	app.use('/api/uploads/*', csrfProtection);
	app.use('/api/taxes/*', csrfProtection);
}

// Documentación Swagger
if (process.env.NODE_ENV !== 'production') {
	app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
} else {
	const swaggerAuth = require('express-basic-auth');
	app.use("/api-docs", swaggerAuth({
		users: { 'admin': process.env.SWAGGER_PASSWORD || 'admin' },
		challenge: true,
	}), swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
}

// Rutas
const healthRoutes = require('./routes/health');
const userRoutes = require('./routes/user_routes');
const productRoutes = require('./routes/product_routes');
const categoryRoutes = require('./routes/category_routes');
const cartRoutes = require('./routes/cart_routes');
const orderRoutes = require('./routes/order_routes');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin_routes');
const siteRoutes = require('./routes/site');
const uploadRoutes = require('./routes/upload_routes');
const taxRoutes = require('./routes/tax_routes');
const seoRoutes = require('./routes/seo_routes');

// Maintenance middleware - debe estar después de las rutas de auth y antes de otras rutas
const maintenanceMiddleware = require('./middlewares/maintenance.middleware');

// Configuración de rutas SEO - estas deben estar a nivel raíz, no bajo /api
app.use('/', seoRoutes);

// Configuración de rutas API
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/site', siteRoutes);

// Aplicar middleware de mantenimiento a todas las rutas excepto admin, auth, health y site
app.use(maintenanceMiddleware);

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/taxes', taxRoutes);

// Headers de seguridad adicionales - Solo en producción
if (process.env.NODE_ENV === 'production') {
	app.use((req, res, next) => {
		res.setHeader('X-Content-Type-Options', 'nosniff');
		res.setHeader('X-Frame-Options', 'DENY');
		res.setHeader('X-XSS-Protection', '1; mode=block');
		res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
		res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
		res.setHeader('Pragma', 'no-cache');
		res.setHeader('Expires', '0');
		next();
	});
}

// Middleware para errores 404
app.use((req, res, next) => {
	const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
	error.statusCode = 404;
	next(error);
});

// Middleware de logging de errores
app.use(errorLogger);

// Middleware de manejo de errores
app.use((err, req, res, next) => {
	// Evitamos enviar múltiples respuestas
	if (res.headersSent) {
		return next(err);
	}
	
	const statusCode = err.statusCode || 500;
	
	// No revelar detalles de errores internos en producción
	const errorResponse = {
		error: process.env.NODE_ENV === 'production'
		  ? (statusCode === 500 ? 'Error interno del servidor' : err.message)
		  : err.message || 'Error interno del servidor',
	};
	
	// Solo incluir stack en desarrollo
	if (process.env.NODE_ENV !== 'production') {
		errorResponse.stack = err.stack;
	}
	
	res.status(statusCode).json(errorResponse);
});

if (require.main === module) {
	const PORT = process.env.PORT || 2300;
	
	// Usar HTTPS en producción
	if (process.env.NODE_ENV === 'production' && process.env.USE_HTTPS === 'true') {
		const https = require('https');
		const fs = require('fs');
		
		// Cargar certificados SSL
		const options = {
			key: fs.readFileSync(process.env.SSL_KEY_PATH || './ssl/key.pem'),
			cert: fs.readFileSync(process.env.SSL_CERT_PATH || './ssl/cert.pem')
		};
		
		// Crear servidor HTTPS
		https.createServer(options, app).listen(PORT, () => {
			console.log(`🔒 Servidor HTTPS ejecutándose en https://localhost:${PORT}`);
		});
	} else {
		// Servidor HTTP para desarrollo
		app.listen(PORT, () => {
			console.log(`🚀 Server Running Successfully on http://localhost:${PORT}`);
		});
	}

	sequelize
		.authenticate()
		.then(() => {
			console.log("✅ Conectado a PostgreSQL");
		})
		.catch((err) => console.error("❌ Error de conexión:", err));

	// Forzar sincronización solo para modificar la tabla de productos
	const shouldForceSync = process.env.FORCE_DB_SYNC === 'true'; // Temporalmente forzar sincronización
	
	sequelize
		.sync({ force: shouldForceSync })
		.then(() => {
			console.log(`✅ Modelos sincronizados ${shouldForceSync ? '(con force)' : ''}`);
		})
		.catch((err) => console.error("❌ Error al sincronizar modelos:", err));
}

module.exports = app;