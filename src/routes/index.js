const express = require('express');
const router = express.Router();
const usersRoutes = require('./users');
const logsRoutes = require('./logs');
const authRoutes = require('./auth');
const personsRoutes = require('./persons');
const contactRoutes = require('./contact');

// Rota de teste para verificar se a API está funcionando
router.get('/', (req, res) => {
  res.json({ message: 'API funcionando!' });
});

// Rotas de autenticação
router.use('/auth', authRoutes);

// Rotas de usuários
router.use('/users', usersRoutes);

// Rotas de logs
router.use('/logs', logsRoutes);

// Rotas de pessoas
router.use('/persons', personsRoutes);

// Rotas de contatos
router.use('/contacts', contactRoutes);

// Rota de fallback para debug
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    method: req.method,
    url: req.url,
    path: req.path,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl
  });
});

module.exports = router;
