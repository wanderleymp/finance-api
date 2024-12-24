const TaskTypesController = require('./tasktypes.controller');
const TaskTypesService = require('./tasktypes.service');
const TaskTypesRepository = require('./tasktypes.repository');
const TaskTypesRoutes = require('./tasktypes.routes');
const { logger } = require('../../middlewares/logger');

class TaskTypesModule {
    constructor() {
        this.repository = new TaskTypesRepository();
        this.service = new TaskTypesService({ 
            taskTypesRepository: this.repository 
        });
        this.controller = new TaskTypesController(this.service);
        this.routes = TaskTypesRoutes; // TaskTypesRoutes já é uma instância
    }

    register(app) {
        logger.info('Registrando módulo de tipos de tasks');
        app.use('/api/tasktypes', this.routes.getRouter());
        logger.info('Módulo de tipos de tasks registrado com sucesso');
    }
}

module.exports = new TaskTypesModule();
