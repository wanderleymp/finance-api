const TaskRoutes = require('./task.routes');
const TaskController = require('./task.controller');
const TaskService = require('./task.service');
const TaskRepository = require('./repositories/task.repository');
const TaskTypesRepository = require('./repositories/task-types.repository');
const TaskLogsService = require('../tasklogs/tasklogs.service');
const TaskDependenciesService = require('../taskdependencies/taskdependencies.service');
const TaskWorker = require('./workers/task.worker');
const BoletoProcessor = require('./processors/boleto.processor');
const BoletoService = require('../boletos/boleto.service');
const { logger } = require('../../middlewares/logger');

class TaskModule {
    constructor() {
        logger.info('Iniciando construção do TaskModule');
        
        this.repository = new TaskRepository();
        this.taskTypesRepository = new TaskTypesRepository();
        this.taskLogsService = new TaskLogsService();
        this.taskDependenciesService = new TaskDependenciesService();
        
        this.service = new TaskService({ 
            taskRepository: this.repository,
            taskTypesRepository: this.taskTypesRepository,
            taskLogsService: this.taskLogsService,
            taskDependenciesService: this.taskDependenciesService
        });

        logger.info('TaskService criado');

        this.worker = new TaskWorker({
            taskService: this.service,
            interval: 5000,
            batchSize: 10
        });

        logger.info('TaskWorker criado');
        
        // Registra o processador de boleto
        const BoletoRepository = require('../boletos/boleto.repository');
        const n8nService = require('../n8n/n8n.service');
        const boletoService = new BoletoService({
            boletoRepository: new BoletoRepository(),
            taskService: this.service,
            n8nService: n8nService
        });

        logger.info('BoletoService criado');

        const boletoProcessor = new BoletoProcessor(this.service, boletoService);
        logger.info('Criando processador de boleto', {
            hasProcessor: !!boletoProcessor,
            type: boletoProcessor.getTaskType(),
            methods: Object.keys(boletoProcessor)
        });

        // Registra o processador
        this.worker.registerProcessor(boletoProcessor);
        logger.info('Processador de boleto registrado');
        
        this.controller = new TaskController(this.service);
        this.routes = TaskRoutes;

        // Inicia o worker DEPOIS de registrar todos os processadores
        logger.info('Iniciando worker de tasks', {
            processors: Array.from(this.worker.processors.keys())
        });
        this.worker.start();

        logger.info('TaskModule construído com sucesso');
    }

    register(app) {
        logger.info('Registrando módulo de tasks');
        app.use('/tasks', this.routes.getRouter());
        
        // Expõe o service e worker para outros módulos
        app.set('taskService', this.service);
        app.set('taskWorker', this.worker);
        
        logger.info('Módulo de tasks registrado com sucesso');
    }

    getService() {
        return this.service;
    }

    getWorker() {
        return this.worker;
    }
}

module.exports = new TaskModule();
