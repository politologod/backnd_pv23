const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { pagination } = require('../middlewares/pagination');

// TODO: Importar el controlador de usuarios cuando esté creado
// const userController = require('../controllers/userController');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtener lista de usuarios
 *     description: Retorna una lista paginada de usuarios
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de usuarios por página
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *       401:
 *         description: No autorizado
 */
router.get('/', auth, pagination, (req, res) => {
    res.json({ 
        message: 'Lista de usuarios',
        pagination: req.pagination
    });
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtener detalle de un usuario
 *     description: Retorna los detalles de un usuario específico
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Detalles del usuario obtenidos exitosamente
 *       404:
 *         description: Usuario no encontrado
 *       401:
 *         description: No autorizado
 */
router.get('/:id', auth, (req, res) => {
    res.json({ message: 'Detalle del usuario' });
});

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     description: Crea un nuevo usuario en el sistema
 *     tags: [Usuarios]
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
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Error en la solicitud
 */
router.post('/register', (req, res) => {
    res.json({ message: 'Registrar usuario' });
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Autentica un usuario y retorna un token JWT
 *     tags: [Usuarios]
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
 *         description: Login exitoso
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', (req, res) => {
    res.json({ message: 'Login de usuario' });
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     description: Actualiza los detalles de un usuario existente
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *       404:
 *         description: Usuario no encontrado
 *       401:
 *         description: No autorizado
 */
router.put('/:id', auth, (req, res) => {
    res.json({ message: 'Actualizar usuario' });
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Eliminar usuario
 *     description: Elimina un usuario del sistema
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *       404:
 *         description: Usuario no encontrado
 *       401:
 *         description: No autorizado
 */
router.delete('/:id', auth, (req, res) => {
    res.json({ message: 'Eliminar usuario' });
});

/**
 * @swagger
 * /api/users/{id}/password:
 *   put:
 *     summary: Cambiar contraseña
 *     description: Actualiza la contraseña de un usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *       401:
 *         description: No autorizado o contraseña actual incorrecta
 */
router.put('/:id/password', auth, (req, res) => {
    res.json({ message: 'Cambiar contraseña' });
});

/**
 * @swagger
 * /api/users/forgot-password:
 *   post:
 *     summary: Solicitar recuperación de contraseña
 *     description: Envía un correo con instrucciones para recuperar la contraseña
 *     tags: [Usuarios]
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
 *         description: Instrucciones enviadas exitosamente
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/forgot-password', (req, res) => {
    res.json({ message: 'Solicitar recuperación de contraseña' });
});

/**
 * @swagger
 * /api/users/reset-password:
 *   post:
 *     summary: Restablecer contraseña
 *     description: Restablece la contraseña usando el token de recuperación
 *     tags: [Usuarios]
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
router.post('/reset-password', (req, res) => {
    res.json({ message: 'Restablecer contraseña' });
});

/**
 * @swagger
 * /api/users/{id}/verify-email:
 *   post:
 *     summary: Verificar correo electrónico
 *     description: Verifica la dirección de correo electrónico del usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de verificación
 *     responses:
 *       200:
 *         description: Correo electrónico verificado exitosamente
 *       400:
 *         description: Token inválido o expirado
 */
router.post('/:id/verify-email', (req, res) => {
    res.json({ message: 'Verificar correo electrónico' });
});

/**
 * @swagger
 * /api/users/{id}/resend-verification:
 *   post:
 *     summary: Reenviar verificación de correo
 *     description: Reenvía el correo de verificación
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Correo de verificación reenviado exitosamente
 *       401:
 *         description: No autorizado
 */
router.post('/:id/resend-verification', auth, (req, res) => {
    res.json({ message: 'Reenviar verificación de correo' });
});

module.exports = router; 