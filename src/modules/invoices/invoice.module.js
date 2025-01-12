const InvoiceRoutes = require('./invoice.routes');
const InvoiceService = require('./invoice.service');
const InvoiceRepository = require('./invoice.repository');
const InvoiceController = require('./invoice.controller');
const { logger } = require('../../middlewares/logger');

class InvoiceModule {
    constructor() {
        this.repository = new InvoiceRepository();
        this.service = new InvoiceService(this.repository);
        this.controller = new InvoiceController(this.service);
        this.routes = InvoiceRoutes;
    }

    register(app) {
        logger.info('Registrando módulo de faturas');
        app.use('/invoices', this.routes.getRouter());
        logger.info('Módulo de faturas registrado com sucesso');
    }
}

module.exports = new InvoiceModule();
