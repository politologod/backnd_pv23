const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');

// TODO: Importar el controlador de órdenes cuando esté creado
// const orderController = require('../controllers/orderController');

// Todas las rutas de órdenes requieren autenticación
router.use(auth);

// Rutas básicas CRUD
router.get('/', (req, res) => {
    res.json({ message: 'Lista de órdenes' });
});

router.get('/:id', (req, res) => {
    res.json({ message: 'Detalle de la orden' });
});

router.post('/', (req, res) => {
    res.json({ message: 'Crear orden' });
});

router.put('/:id', (req, res) => {
    res.json({ message: 'Actualizar orden' });
});

router.delete('/:id', (req, res) => {
    res.json({ message: 'Eliminar orden' });
});

// Rutas específicas para órdenes
router.get('/user/:userId', (req, res) => {
    res.json({ message: 'Órdenes del usuario' });
});

router.post('/:id/status', (req, res) => {
    res.json({ message: 'Actualizar estado de la orden' });
});

router.post('/:id/cancel', (req, res) => {
    res.json({ message: 'Cancelar orden' });
});

router.post('/:id/complete', (req, res) => {
    res.json({ message: 'Completar orden' });
});

module.exports = router; 