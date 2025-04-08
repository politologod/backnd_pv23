const express = require('express');

const router = express.Router();

// Get all items in the cart
router.get('/', (req, res) => {
    res.send('Get all items in the cart');
});

// Add an item to the cart
router.post('/', (req, res) => {
    res.send('Add an item to the cart');
});

// Update an item in the cart
router.put('/:id', (req, res) => {
    res.send(`Update item with ID ${req.params.id} in the cart`);
});

// Delete an item from the cart
router.delete('/:id', (req, res) => {
    res.send(`Delete item with ID ${req.params.id} from the cart`);
});

module.exports = router;