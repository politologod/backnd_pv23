import express from 'express';
import passport from 'passport';
import {  createToken  } from '../configs/passport';
import {  auth, checkRole  } from '../middlewares/auth';
import logger from '../configs/logger';
const authRouter = express.Router();

// 🔹 Iniciar sesión con Google - Exclusivo para clientes/storefront
authRouter.get(
	"/google",
	passport.authenticate("google", {
		session: false,
		scope: ["profile", "email"],
	})
);

// 🔹 Callback después de autenticarse con Google
authRouter.get(
	"/google/callback",
	passport.authenticate("google", { session: false, failureRedirect: "/login" }),
	(req: any, res: any) => {
		try {
			// 1️⃣ Verificar si el usuario existe en la BD
			if (!req.user) {
				logger.error('Callback Google: Usuario no encontrado después de autenticación');
				return res.status(401).json({ message: "Error al autenticar usuario." });
			}

			// 2️⃣ Asegurar que el rol sea customer (defensa adicional)
			if (req.user.role !== 'customer') {
				logger.warn('Callback Google: Usuario con rol no customer intentando acceder', { 
					userId: req.user.id,
					role: req.user.role
				});
				// Forzar rol customer para esta sesión
				req.user.role = 'customer';
			}

			// 3️⃣ Generar token
			const token = createToken(req.user);

			// 4️⃣ Configurar cookie segura
			const cookieOptions = {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
				maxAge: 24 * 60 * 60 * 1000, // 1 día
				path: "/"
			};

			// Añadir dominio en producción si está configurado
			if (process.env.NODE_ENV === "production" && process.env.COOKIE_DOMAIN) {
				(cookieOptions as any).domain = process.env.COOKIE_DOMAIN;
			}

			res.cookie("token", token, cookieOptions);

			// 5️⃣ Registrar éxito y redirigir al frontend
			logger.info('Usuario autenticado exitosamente con Google', { 
				userId: req.user.id, 
				email: req.user.email 
			});
			res.redirect(`${process.env.FRONTEND_URL}/auth/success`);
		} catch (error) {
			logger.error('Error en callback de Google', { error: (error as Error).message, stack: (error as Error).stack });
			res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
		}
	}
);

import {  register, login, logout, verifyToken, requestPasswordReset, resetPassword, refreshToken  } from '../controllers/auth_controller';

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario (cliente)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Datos inválidos o email ya registrado
 */
authRouter.post("/register", register);

/**
 * @swagger
 * /api/auth/register/admin:
 *   post:
 *     summary: Registrar nuevo usuario admin
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Admin registrado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Rol insuficiente
 */
authRouter.post("/register/admin", auth, checkRole(["admin"]), register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login exitoso, retorna token JWT en cookie
 *       401:
 *         description: Credenciales inválidas
 */
authRouter.post("/login", login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 */
authRouter.post("/logout", logout);

/**
 * @swagger
 * /api/auth/request-password-reset:
 *   post:
 *     summary: Solicitar restablecimiento de contraseña
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email de restablecimiento enviado
 *       404:
 *         description: Usuario no encontrado
 */
authRouter.post("/request-password-reset", requestPasswordReset);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Restablecer contraseña con token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Contraseña restablecida exitosamente
 *       400:
 *         description: Token inválido o expirado
 */
authRouter.post("/reset-password", resetPassword);

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verificar token JWT
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido, retorna datos del usuario
 *       401:
 *         description: Token inválido o expirado
 */
authRouter.get("/verify", verifyToken, (req: any, res: any) => {
	res.json(req.user);
});

/**
 * @swagger
 * /api/auth/verify/admin:
 *   get:
 *     summary: Verificar permisos de administrador
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Acceso admin verificado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Rol insuficiente
 */
authRouter.get("/verify/admin", auth, checkRole(["admin"]), (req: any, res: any) => {
	res.status(200).json({ 
		message: 'Acceso admin verificado', 
		user: {
			id: req.user.id,
			email: req.user.email,
			name: req.user.name,
			role: req.user.role
		}
	});
});

authRouter.post('/refresh', refreshToken);

export default authRouter;
