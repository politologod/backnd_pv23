const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');

// TODO: Importar el controlador de productos cuando esté creado
// const productController = require('../controllers/productController');

// Rutas públicas
router.get('/', (req, res) => {
    res.json({ message: 'Lista de productos' });
});

router.get('/:id', (req, res) => {
    res.json({ message: 'Detalle del producto' });
});

// Rutas protegidas (requieren autenticación)
router.post('/', auth, (req, res) => {
    res.json({ message: 'Crear producto' });
});

router.put('/:id', auth, (req, res) => {
    res.json({ message: 'Actualizar producto' });
});

router.delete('/:id', auth, (req, res) => {
    res.json({ message: 'Eliminar producto' });
});

module.exports = router; 