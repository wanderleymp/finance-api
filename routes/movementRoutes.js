const express = require('express');
const { getMovementsPaginated } = require('../controllers/movementController');

const router = express.Router();

// Rota para buscar movimentos com paginação
router.get('/', getMovementsPaginated);

module.exports = router;
