const MovementTypeRepository = require('./movement-type.repository');
const MovementTypeService = require('./movement-type.service');
const MovementTypeController = require('./movement-type.controller');

class MovementTypeModule {
    static register(app) {
        const repository = new MovementTypeRepository();
        const service = new MovementTypeService({ movementTypeRepository: repository });
        const controller = new MovementTypeController({ movementTypeService: service });

        // Registra as rotas
        app.use('/movement-types', controller.router);
    }
}

module.exports = MovementTypeModule;
