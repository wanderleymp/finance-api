const InvoiceEventRoutes = require('./invoice-event.routes');
const InvoiceEventService = require('./invoice-event.service');
const InvoiceEventRepository = require('./invoice-event.repository');
const InvoiceEventController = require('./invoice-event.controller');
const { logger } = require('../../middlewares/logger');

class InvoiceEventModule {
    constructor() {
        this.repository = new InvoiceEventRepository();
        this.service = new InvoiceEventService(this.repository);
        this.controller = new InvoiceEventController(this.service);
        this.routes = new InvoiceEventRoutes(this.controller);
    }

    register(app) {
        logger.info('Registrando módulo de eventos de faturas');
        app.use('/invoice-events', this.routes.getRouter());
        logger.info('Módulo de eventos de faturas registrado com sucesso');
    }
}

module.exports = new InvoiceEventModule();
