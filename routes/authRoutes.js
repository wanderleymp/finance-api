// authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // Certifique-se de que o caminho está correto

// Definição das rotas
router.post('/login', authController.login);
router.post('/user-new', authController.userNew);
router.post('/update-password', authController.updatePassword);

module.exports = router;
