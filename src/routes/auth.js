const express = require("express");
const passport = require("passport");
const { createToken } = require("../configs/passport");
const authRouter = express.Router();

// 🔹 Iniciar sesión con Google
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
				return res.status(401).json({ message: "Error al autenticar usuario." });
			}

			// 2️⃣ Generar token
			const token = createToken(req.user);

			// 3️⃣ Enviar token en una cookie segura
			res.cookie("token", token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "Strict",
				maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
			});

			// 4️⃣ Redirigir al frontend con éxito
			res.redirect(`${process.env.FRONTEND_URL}/auth/success`);
		} catch (error) {
			console.error("Error en Google Callback:", error);
			res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
		}
	}
);

// 🔹 Cerrar sesión
authRouter.get("/logout", (req, res) => {
	res.clearCookie("token");
	res.redirect(`${process.env.FRONTEND_URL}/`);
});



const { register, login, logout, verifyToken } = require("../controllers/authController");

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/logout", logout);
authRouter.get("/verify", verifyToken, (req, res) => {
	res.json(req.user);
});

module.exports = authRouter;
