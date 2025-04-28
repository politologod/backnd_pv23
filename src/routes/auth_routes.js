const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth_controller');
const { validateRegister, validateLogin } = require('../middleware/validators/auth_validator');
const authMiddleware = require('../middleware/auth_middleware');

// Rutas públicas
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

// Rutas protegidas
router.get('/profile', authMiddleware.verifyToken, authController.getUserProfile);
router.post('/logout', authMiddleware.verifyToken, authController.logout);
router.put('/update-profile', authMiddleware.verifyToken, authController.updateUserProfile);
router.put('/change-password', authMiddleware.verifyToken, authController.changePassword);

module.exports = router; 