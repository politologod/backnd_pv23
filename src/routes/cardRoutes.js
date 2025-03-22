const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');

// TODO: Importar el controlador de cartas cuando esté creado
// const cardController = require('../controllers/cardController');

// Rutas públicas
router.get('/', (req, res) => {
    res.json({ message: 'Lista de cartas' });
});

router.get('/:id', (req, res) => {
    res.json({ message: 'Detalle de la carta' });
});

// Rutas protegidas (requieren autenticación)
router.post('/', auth, (req, res) => {
    res.json({ message: 'Crear carta' });
});

router.put('/:id', auth, (req, res) => {
    res.json({ message: 'Actualizar carta' });
});

router.delete('/:id', auth, (req, res) => {
    res.json({ message: 'Eliminar carta' });
});

// Rutas específicas para cartas
router.get('/user/:userId', auth, (req, res) => {
    res.json({ message: 'Cartas del usuario' });
});

router.post('/:id/trade', auth, (req, res) => {
    res.json({ message: 'Intercambiar carta' });
});

module.exports = router; 