const express = require('express');
const BoletoController = require('./boleto.controller');
const BoletoService = require('./boleto.service');
const BoletoRepository = require('./boleto.repository');
const { systemDatabase } = require('../../config/database');
const { logger } = require('../../middlewares/logger');

// Instancia o repositório
const repository = new BoletoRepository(systemDatabase.pool);

// Instancia o serviço
const service = new BoletoService({ 
    boletoRepository: repository
});

// Instancia o controller
const controller = new BoletoController({ 
    boletoService: service 
});

// Configura as rotas
const router = express.Router();
const boletoRoutes = require('./boleto.routes')(controller);

router.use('/', boletoRoutes);

logger.info('Módulo de boletos registrado com sucesso', {
    routes: [
        'GET /boletos',
        'GET /boletos/details',
        'GET /boletos/:id',
        'GET /boletos/:id/details',
        'POST /boletos',
        'PUT /boletos/:id'
    ]
});

module.exports = router;
