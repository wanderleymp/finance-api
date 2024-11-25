const express = require('express');
const router = express.Router();
const usersRoutes = require('./users');

// Rota de teste para verificar se a API está funcionando
router.get('/', (req, res) => {
  res.json({ message: 'API funcionando!' });
});

// Rotas de usuários
router.use('/users', usersRoutes);

module.exports = router;
