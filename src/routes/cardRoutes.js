const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { pagination } = require('../middlewares/pagination');

// TODO: Importar el controlador de cartas cuando esté creado
// const cardController = require('../controllers/cardController');

/**
 * @swagger
 * /api/cards:
 *   get:
 *     summary: Obtener lista de cartas
 *     description: Retorna una lista paginada de cartas
 *     tags: [Cartas]
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
 *         description: Cantidad de cartas por página
 *     responses:
 *       200:
 *         description: Lista de cartas obtenida exitosamente
 */
router.get('/', pagination, (req, res) => {
    res.json({ 
        message: 'Lista de cartas',
        pagination: req.pagination
    });
});

/**
 * @swagger
 * /api/cards/{id}:
 *   get:
 *     summary: Obtener detalle de una carta
 *     description: Retorna los detalles de una carta específica
 *     tags: [Cartas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la carta
 *     responses:
 *       200:
 *         description: Detalles de la carta obtenidos exitosamente
 *       404:
 *         description: Carta no encontrada
 */
router.get('/:id', (req, res) => {
    res.json({ message: 'Detalle de la carta' });
});

/**
 * @swagger
 * /api/cards:
 *   post:
 *     summary: Crear una nueva carta
 *     description: Crea una nueva carta en el sistema
 *     tags: [Cartas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               image:
 *                 type: string
 *               rarity:
 *                 type: string
 *                 enum: [common, uncommon, rare, epic, legendary]
 *     responses:
 *       201:
 *         description: Carta creada exitosamente
 *       401:
 *         description: No autorizado
 */
router.post('/', auth, (req, res) => {
    res.json({ message: 'Crear carta' });
});

/**
 * @swagger
 * /api/cards/{id}:
 *   put:
 *     summary: Actualizar una carta
 *     description: Actualiza los detalles de una carta existente
 *     tags: [Cartas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la carta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               image:
 *                 type: string
 *               rarity:
 *                 type: string
 *                 enum: [common, uncommon, rare, epic, legendary]
 *     responses:
 *       200:
 *         description: Carta actualizada exitosamente
 *       404:
 *         description: Carta no encontrada
 *       401:
 *         description: No autorizado
 */
router.put('/:id', auth, (req, res) => {
    res.json({ message: 'Actualizar carta' });
});

/**
 * @swagger
 * /api/cards/{id}:
 *   delete:
 *     summary: Eliminar una carta
 *     description: Elimina una carta del sistema
 *     tags: [Cartas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la carta
 *     responses:
 *       200:
 *         description: Carta eliminada exitosamente
 *       404:
 *         description: Carta no encontrada
 *       401:
 *         description: No autorizado
 */
router.delete('/:id', auth, (req, res) => {
    res.json({ message: 'Eliminar carta' });
});

/**
 * @swagger
 * /api/cards/user/{userId}:
 *   get:
 *     summary: Obtener cartas de un usuario
 *     description: Retorna una lista paginada de cartas pertenecientes a un usuario
 *     tags: [Cartas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
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
 *         description: Cantidad de cartas por página
 *     responses:
 *       200:
 *         description: Lista de cartas del usuario obtenida exitosamente
 *       401:
 *         description: No autorizado
 */
router.get('/user/:userId', auth, pagination, (req, res) => {
    res.json({ 
        message: 'Cartas del usuario',
        pagination: req.pagination
    });
});

/**
 * @swagger
 * /api/cards/{id}/trade:
 *   post:
 *     summary: Intercambiar una carta
 *     description: Permite intercambiar una carta con otro usuario
 *     tags: [Cartas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la carta a intercambiar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetUserId
 *               - targetCardId
 *             properties:
 *               targetUserId:
 *                 type: integer
 *                 description: ID del usuario con quien se intercambia
 *               targetCardId:
 *                 type: integer
 *                 description: ID de la carta que se quiere recibir
 *     responses:
 *       200:
 *         description: Intercambio realizado exitosamente
 *       400:
 *         description: Error en la solicitud de intercambio
 *       401:
 *         description: No autorizado
 */
router.post('/:id/trade', auth, (req, res) => {
    res.json({ message: 'Intercambiar carta' });
});

/**
 * @swagger
 * /api/cards/search:
 *   get:
 *     summary: Buscar cartas
 *     description: Busca cartas según criterios específicos
 *     tags: [Cartas]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *       - in: query
 *         name: rarity
 *         schema:
 *           type: string
 *           enum: [common, uncommon, rare, epic, legendary]
 *         description: Rareza de la carta
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Precio mínimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Precio máximo
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
 *         description: Cantidad de resultados por página
 *     responses:
 *       200:
 *         description: Resultados de la búsqueda
 */
router.get('/search', pagination, (req, res) => {
    res.json({ 
        message: 'Búsqueda de cartas',
        pagination: req.pagination
    });
});

/**
 * @swagger
 * /api/cards/filter:
 *   get:
 *     summary: Filtrar cartas
 *     description: Filtra cartas según criterios específicos
 *     tags: [Cartas]
 *     parameters:
 *       - in: query
 *         name: rarity
 *         schema:
 *           type: string
 *           enum: [common, uncommon, rare, epic, legendary]
 *         description: Rareza de la carta
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Precio mínimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Precio máximo
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
 *         description: Cantidad de resultados por página
 *     responses:
 *       200:
 *         description: Resultados del filtrado
 */
router.get('/filter', pagination, (req, res) => {
    res.json({ 
        message: 'Filtrar cartas',
        pagination: req.pagination
    });
});

module.exports = router; 