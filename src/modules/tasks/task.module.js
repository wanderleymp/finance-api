const TaskRoutes = require('./task.routes');
const TaskController = require('./task.controller');
const TaskService = require('./task.service');
const TaskRepository = require('./repositories/task.repository');
const { logger } = require('../../middlewares/logger');

class TaskModule {
    constructor() {
        this.repository = new TaskRepository();
        this.service = new TaskService({ 
            taskRepository: this.repository 
        });
        this.controller = new TaskController(this.service);
        this.routes = TaskRoutes; // TaskRoutes já é uma instância
    }

    register(app) {
        logger.info('Registrando módulo de tasks');
        app.use('/api/tasks', this.routes.getRouter());
        logger.info('Módulo de tasks registrado com sucesso');
    }
}

module.exports = new TaskModule();
