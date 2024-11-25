const express = require('express');
const router = express.Router();
const usersRoutes = require('./users');
const logsRoutes = require('./logs');

// Rota de teste para verificar se a API está funcionando
router.get('/', (req, res) => {
  res.json({ message: 'API funcionando!' });
});

// Rotas de usuários
router.use('/users', usersRoutes);

// Rotas de logs
router.use('/logs', logsRoutes);

module.exports = router;
