const TaskLogsController = require('./tasklogs.controller');
const TaskLogsService = require('./tasklogs.service');
const TaskLogsRepository = require('./tasklogs.repository');
const TaskLogsRoutes = require('./tasklogs.routes');
const { logger } = require('../../middlewares/logger');

class TaskLogsModule {
    constructor() {
        this.repository = new TaskLogsRepository();
        this.service = new TaskLogsService({ 
            taskLogsRepository: this.repository 
        });
        this.controller = new TaskLogsController(this.service);
        this.routes = TaskLogsRoutes; // TaskLogsRoutes já é uma instância
    }

    register(app) {
        logger.info('Registrando módulo de logs de tasks');
        app.use('/api/tasklogs', this.routes.getRouter());
        logger.info('Módulo de logs de tasks registrado com sucesso');
    }
}

module.exports = new TaskLogsModule();
