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
const BoletoRepository = require('../boletos/boleto.repository');
const n8nService = require('../../services/n8n.service');
const { logger } = require('../../middlewares/logger');

class TaskModule {
    constructor() {
        logger.info('Iniciando construção do TaskModule');
        
        this.repository = new TaskRepository();
        this.taskTypesRepository = new TaskTypesRepository();
        this.taskLogsService = new TaskLogsService();
        this.taskDependenciesService = new TaskDependenciesService();
        
        logger.info('Preparando para criar TaskService', {
            repositoryExists: !!this.repository,
            taskTypesRepositoryExists: !!this.taskTypesRepository,
            taskLogsServiceExists: !!this.taskLogsService,
            taskDependenciesServiceExists: !!this.taskDependenciesService
        });

        this.service = new TaskService({ 
            taskRepository: this.repository,
            taskTypesRepository: this.taskTypesRepository,
            taskLogsService: this.taskLogsService,
            taskDependenciesService: this.taskDependenciesService
        });

        logger.info('TaskService criado', {
            serviceMethods: Object.keys(this.service),
            serviceMethodsCount: Object.keys(this.service).length
        });

        this.worker = new TaskWorker({
            taskService: this.service,
            interval: 5000,
            batchSize: 10
        });

        logger.info('TaskWorker criado');
        
        // Registra o processador de boleto
        const boletoService = new BoletoService({
            boletoRepository: new BoletoRepository(),
            taskService: this.service,
            n8nService: n8nService
        });

        logger.info('BoletoService criado');

        const boletoProcessor = new BoletoProcessor(this.service, boletoService);
        
        logger.info('BoletoProcessor construído', {
            hasBoletoService: !!boletoService,
            hasTaskService: !!this.service
        });

        // Registra o processador no worker
        this.worker.registerProcessor(boletoProcessor);
        
        // Inicia o worker
        this.worker.start();

        // Cria o controller ANTES das rotas
        this.controller = new TaskController(this.service);
        
        logger.info('TaskController criado', {
            serviceMethods: Object.keys(this.service),
            controllerMethods: Object.keys(this.controller)
        });
        
        // Cria as rotas DEPOIS do controller
        this.routes = new TaskRoutes(this.controller);

        logger.info('TaskRoutes criado', {
            controllerMethods: Object.keys(this.controller),
            routesMethods: Object.keys(this.routes)
        });

        logger.info('TaskModule inicializado completamente');
    }

    getRouter() {
        return this.routes.getRouter();
    }

    register(app) {
        logger.info('Registrando TaskModule', {
            appExists: !!app
        });

        if (!app) {
            throw new Error('Aplicação Express não pode ser undefined');
        }

        // Registra o serviço de tasks na aplicação para uso em outros módulos
        app.set('taskService', this.service);

        // Registra as rotas do módulo de tasks
        app.use('/tasks', this.getRouter());

        logger.info('TaskModule registrado com sucesso', {
            routePath: '/tasks',
            taskServiceRegistered: !!app.get('taskService')
        });

        return this;
    }
}

module.exports = new TaskModule();
