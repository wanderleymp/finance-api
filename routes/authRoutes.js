// authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middlewares/authMiddleware');

// Definição das rotas
router.post('/login', authController.login);
router.post('/user-new', authController.userNew);
router.post('/update-password', authController.updatePassword);
// Rota para obter os detalhes do usuário logado
router.get('/user-details', authenticateToken, authController.getUserDetails);
// Rota para listar todos os usuários (apenas para usuários autenticados)
router.get('/users', authenticateToken, authController.getUsers);

module.exports = router;
