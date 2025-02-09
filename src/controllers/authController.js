const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// 🔹 Generar token JWT con más información útil
const createToken = (user) => {
	return jwt.sign(
		{ id: user.id, email: user.email, name: user.name },
		process.env.JWT_SECRET,
		{ expiresIn: "7d" }
	);
};

// 🔹 Registro con email y contraseña
exports.register = async (req, res) => {
	try {
		const { name, email, password, address, phone } = req.body;

		// 1️⃣ Validar datos
		if (!email || !password || !name) {
			return res.status(400).json({ message: "Todos los campos son obligatorios." });
		}

		// 2️⃣ Verificar si el usuario ya existe
		const existingUser = await User.findOne({ where: { email } });
		if (existingUser) {
			return res.status(400).json({ message: "El correo ya está en uso." });
		}

		// 3️⃣ Validar la contraseña
		if (password.length < 6) {
			return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres." });
		}

		// 4️⃣ Crear usuario
		const user = await User.create({
			name,
			email,
			password,
			address,
			phone,
		});

		// 5️⃣ Generar token y enviar como cookie segura
		const token = createToken(user);
		res.cookie("token", token, {
			httpOnly: true, 
			secure: true, 
			sameSite: "none",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
		});

		res.status(201).json({ message: "Usuario registrado con éxito.", user });
	} catch (error) {
		res.status(500).json({ message: "Error al registrar usuario.", error: error.message });
	}
};

// 🔹 Inicio de sesión con email y contraseña
exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;

		// 1️⃣ Verificar si el usuario existe
		const user = await User.findOne({ where: { email } });
		if (!user) {
			return res.status(401).json({ message: "Credenciales incorrectas." });
		}

		// 2️⃣ Verificar si el usuario usa Google (no tiene contraseña)
		if (!user.password) {
			return res.status(400).json({ message: "Por favor, inicia sesión con Google." });
		}

		// 3️⃣ Comparar contraseñas
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(401).json({ message: "Credenciales incorrectas." });
		}

		// 4️⃣ Generar token y enviarlo como cookie
		const token = createToken(user);
		res.cookie("token", token, {
			httpOnly: true,
			secure: true,
			sameSite: "none",
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		res.json({ message: "Inicio de sesión exitoso.", user });
	} catch (error) {
		res.status(500).json({ message: "Error al iniciar sesión.", error: error.message });
	}
};

// 🔹 Cerrar sesión
exports.logout = (req, res) => {
	res.clearCookie("token");
	res.json({ message: "Cierre de sesión exitoso." });
};

exports.verifyToken = (req, res, next) => {
	// Se asume que el JWT se almacena en una cookie llamada 'authToken'
	const token = req.cookies["token"];
	if (!token) {
		return res.status(401).json({ message: "No se proporcionó token" });
	}

	jwt.verify(
		token,
		process.env.JWT_SECRET,
		(err, decoded) => {
			if (err) {
				return res.status(401).json({ message: "Token inválido" });
			}
			// Guarda la información decodificada para usarla en otras rutas
			req.user = decoded;
			next();
		}
	);
}
