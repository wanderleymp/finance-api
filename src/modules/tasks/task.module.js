const TaskRoutes = require('./task.routes');
const TaskController = require('./task.controller');
const TaskService = require('./task.service');
const TaskRepository = require('./repositories/task.repository');
const TaskTypesRepository = require('./repositories/task-types.repository');
const TaskLogsService = require('../tasklogs/tasklogs.service');
const TaskDependenciesService = require('../taskdependencies/taskdependencies.service');
const TaskWorker = require('./workers/task.worker');
const { logger } = require('../../middlewares/logger');

class TaskModule {
    constructor() {
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

        this.worker = new TaskWorker({
            taskService: this.service,
            interval: 5000,
            batchSize: 10
        });
        
        this.controller = new TaskController(this.service);
        this.routes = TaskRoutes;
    }

    register(app) {
        logger.info('Registrando módulo de tasks');
        app.use('/api/tasks', this.routes.getRouter());
        
        // Expõe o service e worker para outros módulos
        app.set('taskService', this.service);
        app.set('taskWorker', this.worker);

        // Inicia o worker
        this.worker.start();
        
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
