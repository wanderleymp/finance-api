const TaskDependenciesRoutes = require("./taskdependencies.routes");
const TaskDependenciesController = require("./taskdependencies.controller");
const TaskDependenciesService = require("./taskdependencies.service");
const TaskDependenciesRepository = require("./taskdependencies.repository");
const { logger } = require('../../middlewares/logger');

class TaskDependenciesModule {
    constructor() {
        this.repository = new TaskDependenciesRepository();
        this.service = new TaskDependenciesService({ 
            taskDependenciesRepository: this.repository 
        });
        this.controller = new TaskDependenciesController(this.service);
        this.routes = TaskDependenciesRoutes; // TaskDependenciesRoutes já é uma instância
    }

    register(app) {
        logger.info('Registrando módulo de dependências de tasks');
        app.use('/api/taskdependencies', this.routes.getRouter());
        logger.info('Módulo de dependências de tasks registrado com sucesso');
    }
}

module.exports = new TaskDependenciesModule();
