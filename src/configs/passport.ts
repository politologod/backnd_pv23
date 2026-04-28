import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import User from '../models/model_user';
import jwt from 'jsonwebtoken';
import logger from '../configs/logger';
require("dotenv").config();

/**
 * Función para crear un token JWT
 * @param {Object} user - Objeto usuario que se va a incluir en el token
 * @returns {String} Token JWT firmado
 */
const createToken = (user) => {
	// Función de ayuda para convertir a objeto si no lo es
	const userObj = typeof user.toObject === 'function' ? user.toObject() : user;
	
	// Verificar que el objeto de usuario tenga las propiedades esperadas
	const payload = {
		id: userObj.id || userObj.id_autoincrement, // Compatibilidad con diferentes modelos
		email: userObj.email,
		name: userObj.name,
		role: userObj.role // Incluir explícitamente el rol
	};
	
	// Configuración JWT 
	const jwtOptions = {
		expiresIn: process.env.JWT_EXPIRATION || "1d",
		algorithm: "HS256"
	};
	
	// Añadir issuer y audience solo en producción
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

// Función para configurar las estrategias de Passport
export default (passport) => {
	// 🟢 Estrategia de autenticación con Google (exclusivamente para clientes/storefront)
	passport.use(
		new GoogleStrategy(
			{
				clientID: process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
				callbackURL: process.env.CALLBACK_URL,
			},
			async (accessToken, refreshToken, profile, done) => {
				try {
					// Extraer información de perfil de Google
					const name = profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim();
					const email = profile.emails && profile.emails[0]?.value;
					const profilePic = profile.photos && profile.photos[0]?.value;
					
					if (!email) {
						logger.error('Autenticación Google: Email no disponible', { profileId: profile.id });
						return done(new Error('No se pudo obtener email del perfil de Google'), null);
					}
					
					// Buscar o crear usuario - siempre con rol 'customer'
					const [user, created] = await User.findOrCreate({
						where: { googleId: profile.id },
						defaults: {
							name,
							email,
							profilePic,
							role: 'customer' // Siempre asignar rol customer para usuarios de Google
						},
					});
					
					// Actualizar información del usuario si ya existía
					if (!created) {
						// Solo actualizar si hay cambios
						const updates = {};
						if (name && name !== user.name) updates.name = name;
						if (profilePic && profilePic !== user.profilePic) updates.profilePic = profilePic;
						
						if (Object.keys(updates).length > 0) {
							await user.update(updates);
						}
						
						// Verificar que el rol sea 'customer' - no permitir escalar privilegios con Google
						if (user.role !== 'customer') {
							logger.warn('Autenticación Google: Intento de acceso con cuenta de rol superior', { 
								userId: user.id, 
								email: user.email, 
								currentRole: user.role 
							});
							// No bloquear acceso, pero asegurar que el rol sea customer para la sesión
							user.role = 'customer';
						}
						
						logger.info('Usuario existente autenticado con Google', { userId: user.id, email: user.email });
					} else {
						logger.info('Nuevo usuario creado vía Google', { userId: user.id, email: user.email });
					}
					
					return done(null, user);
				} catch (err) {
					logger.error('Error autenticando con Google', { error: err.message });
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
				algorithms: ["HS256"],
				// Solo exigir issuer y audience en producción
				...(process.env.NODE_ENV === 'production' ? {
					issuer: "puravida-api",
					audience: "puravida-client",
				} : {}),
				ignoreExpiration: false
			},
			async (jwtPayload, done) => {
				try {
					// Buscar usuario por ID
					const user = await User.findByPk(jwtPayload.id);
					
					if (!user) {
						logger.warn('JWT válido pero usuario no encontrado', { 
							userId: jwtPayload.id,
							tokenRole: jwtPayload.role
						});
						return done(null, false);
					}
					
					// Verificar que el rol en el token coincida con el rol actual del usuario
					// Esto previene el uso de tokens antiguos si el rol del usuario cambió
					if (jwtPayload.role !== user.role) {
						logger.warn('JWT contiene rol diferente al actual del usuario', { 
							userId: user.id,
							tokenRole: jwtPayload.role,
							currentRole: user.role
						});
						return done(null, false);
					}
					
					logger.debug('Usuario autenticado con JWT', { userId: user.id, role: user.role });
					return done(null, user);
				} catch (err) {
					logger.error('Error validando JWT', { error: err.message });
					return done(err, false);
				}
			}
		)
	);
};

// Exportamos la función para generar tokens
export { createToken };
