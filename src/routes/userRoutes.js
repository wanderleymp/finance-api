const express = require('express');
const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');
const { loggerMiddleware } = require('../middlewares/logger');

const router = express.Router();

// Middleware de log para todas as rotas
router.use(loggerMiddleware);

// Rotas públicas de autenticação
router.post('/register', UserController.register);
router.post('/login', UserController.login);

// Exemplo de rota protegida
router.get('/profile', authMiddleware, (req, res) => {
  res.status(200).json({
    message: 'Perfil do usuário',
    userId: req.userId
  });
});

module.exports = router;
