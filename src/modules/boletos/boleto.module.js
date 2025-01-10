const express = require('express');
const BoletoController = require('./boleto.controller');
const BoletoService = require('./boleto.service');
const BoletoRepository = require('./boleto.repository');
const { systemDatabase } = require('../../config/database');
const { logger } = require('../../middlewares/logger');
const N8nService = require('../../services/n8n.service');

const router = express.Router();

// Função para registrar o módulo
const register = (app) => {
    // Pega a instância do taskService já registrada
    const taskService = app.get('taskService');
    if (!taskService) {
        throw new Error('TaskService não encontrado. Registre o módulo de tasks primeiro.');
    }

    // Instancia o repositório
    const repository = new BoletoRepository(systemDatabase.pool);
    const n8nService = N8nService;

    // Instancia o serviço
    const service = new BoletoService({ 
        boletoRepository: repository,
        n8nService,
        taskService
    });

    // Instancia o controller
    const controller = new BoletoController({ 
        boletoService: service 
    });

    // Configura as rotas
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

    return router;
};

module.exports = register;
