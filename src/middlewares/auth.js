const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        // Obtener el token de la cookie
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: 'No se proporcionó token de autenticación' });
        }

        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Agregar el usuario decodificado a la solicitud
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

module.exports = { auth }; 