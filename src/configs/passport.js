const GoogleStrategy = require("passport-google-oauth20").Strategy;
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const User = require("../models/user");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Función para crear un token JWT
const createToken = (user) => {
	return jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// Función para configurar las estrategias de Passport
module.exports = (passport) => {
	// 🟢 Estrategia de autenticación con Google
	passport.use(
		new GoogleStrategy(
			{
				clientID: process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
				callbackURL: process.env.CALLBACK_URL,
			},
			async (accessToken, refreshToken, profile, done) => {
				try {
					const [user, created] = await User.findOrCreate({
						where: { googleId: profile.id },
						defaults: {
							name: profile.name,
							email: profile.emails[0].value,
							profilePic: profile.photos[0].value,
						},
					});
					if (created) {
						console.log("Nuevo usuario creado:", user.name);
					} else {
						console.log("Usuario existente autenticado:", user.name);
					}
					return done(null, user);
				} catch (err) {
					console.error("Error autenticando con Google:", err);
					return done(err, null);
				}
			}
		)
	);

	// 🔵 Estrategia de autenticación con JWT
	passport.use(
		new JwtStrategy(
			{
				jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
				secretOrKey: process.env.JWT_SECRET,
			},
			async (jwtPayload, done) => {
				try {
					const user = await User.findByPk(jwtPayload.id);
					if (user) {
						return done(null, user);
					} else {
						return done(null, false);
					}
				} catch (err) {
					console.error("Error autenticando con JWT:", err);
					return done(err, false);
				}
			}
		)
	);
};

// Exportamos la función para generar tokens
module.exports.createToken = createToken;
