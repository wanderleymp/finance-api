const express = require('express');
const healthController = require('./health.controller');

const router = express.Router();

// Rota principal de health check
router.get('/', healthController.check);

// Rota específica para status dos bancos de dados
router.get('/databases', healthController.checkDatabases);

// Rota específica para métricas do sistema
router.get('/system', healthController.checkSystem);

module.exports = router;
