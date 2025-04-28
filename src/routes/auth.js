const express = require("express");
const passport = require("passport");
const { createToken } = require("../configs/passport");
const { auth, checkRole } = require("../middlewares/auth");
const logger = require("../configs/logger");
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
	(req, res) => {
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
				cookieOptions.domain = process.env.COOKIE_DOMAIN;
			}

			res.cookie("token", token, cookieOptions);

			// 5️⃣ Registrar éxito y redirigir al frontend
			logger.info('Usuario autenticado exitosamente con Google', { 
				userId: req.user.id, 
				email: req.user.email 
			});
			res.redirect(`${process.env.FRONTEND_URL}/auth/success`);
		} catch (error) {
			logger.error('Error en callback de Google', { error: error.message, stack: error.stack });
			res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
		}
	}
);

const { register, login, logout, verifyToken, requestPasswordReset, resetPassword } = require("../controllers/auth_controller");

// 🔹 Registro de usuario (cualquiera puede registrarse como customer)
authRouter.post("/register", register);

// 🔹 Registro de usuario admin (solo admins pueden crear otros admins)
authRouter.post("/register/admin", auth, checkRole(["admin"]), register);

// 🔹 Login normal con email/password
authRouter.post("/login", login);

// 🔹 Cerrar sesión
authRouter.post("/logout", logout);

// 🔹 Solicitar restablecimiento de contraseña
authRouter.post("/request-password-reset", requestPasswordReset);

// 🔹 Restablecer contraseña con token
authRouter.post("/reset-password", resetPassword);

// 🔹 Verificación de token para frontend
authRouter.get("/verify", verifyToken, (req, res) => {
	res.json(req.user);
});

// 🔹 Verificación de permisos admin (útil para verificar acceso a panel admin)
authRouter.get("/verify/admin", auth, checkRole(["admin"]), (req, res) => {
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

module.exports = authRouter;
