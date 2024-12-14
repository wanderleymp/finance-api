const express = require('express');
const UserController = require('../controllers/userController');
const { authMiddleware } = require('../middlewares/auth');
const { loggerMiddleware } = require('../middlewares/logger');

const router = express.Router();

// Middleware de log para todas as rotas
router.use(loggerMiddleware);

// Rotas públicas de autenticação
router.post('/register', UserController.register);
router.post('/login', UserController.login);

// Exemplo de rota protegida
// Rota de usuário removida temporariamente

module.exports = router;
