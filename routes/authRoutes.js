// routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // Verifique se o caminho está correto

// Definindo a rota para login
router.post('/login', authController.login);

module.exports = router;
