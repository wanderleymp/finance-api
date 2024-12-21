const MovementStatusRepository = require('./movement-status.repository');
const MovementStatusService = require('./movement-status.service');
const MovementStatusController = require('./movement-status.controller');

class MovementStatusModule {
    static register(app) {
        const repository = new MovementStatusRepository();
        const service = new MovementStatusService({ movementStatusRepository: repository });
        const controller = new MovementStatusController({ movementStatusService: service });

        // Registra as rotas
        app.use('/movement-statuses', controller.router);
    }
}

module.exports = MovementStatusModule;
