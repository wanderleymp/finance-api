const express = require('express');
const BoletoController = require('./boleto.controller');
const BoletoService = require('./boleto.service');
const BoletoRepository = require('./boleto.repository');
const { systemDatabase } = require('../../config/database');
const { logger } = require('../../middlewares/logger');
const N8nService = require('../../services/n8n.service');
const TaskService = require('../tasks/services/task.service');
const TaskRepository = require('../tasks/repositories/task.repository');
const LogsService = require('../tasks/services/logs.service');
const LogsRepository = require('../tasks/repositories/logs.repository');

// Instancia o repositório
const repository = new BoletoRepository(systemDatabase.pool);
const n8nService = N8nService;
const taskRepository = new TaskRepository();
const logsRepository = new LogsRepository(systemDatabase.pool);
const logsService = new LogsService({ logsRepository });
const taskService = new TaskService({ 
    taskRepository, 
    logsService 
});

console.log('DEBUG: TaskService criado', {
    taskRepository: !!taskRepository,
    logsRepository: !!logsRepository,
    taskService: !!taskService,
    logsService: !!logsService,
    createMethod: !!taskService.create
});

// Instancia o serviço
const service = new BoletoService({ 
    boletoRepository: repository,
    n8nService,
    taskService
});

console.log('DEBUG: BoletoService criado', {
    taskServiceInBoletoService: !!service.taskService,
    createMethodInBoletoService: !!service.taskService?.create
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
