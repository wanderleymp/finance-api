// routes/personRoutes.js

const express = require('express');
const router = express.Router();
const personController = require('../controllers/personController');
const authenticateToken = require('../middlewares/authMiddleware');

// Rota para obter pessoas vinculadas ao usuário logado
router.get('/', authenticateToken, personController.getPersons);

module.exports = router;
