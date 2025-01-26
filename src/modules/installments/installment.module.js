const InstallmentController = require('./installment.controller');
const InstallmentService = require('./installment.service');
const InstallmentRepository = require('./installment.repository');
const BoletoRepository = require('../boletos/boleto.repository');
const BoletoService = require('../boletos/boleto.service');
const installmentRoutes = require('./installment.routes');
const N8nService = require('../../services/n8n.service');

class InstallmentModule {
    constructor(app) {
        this.app = app;
        this.repository = new InstallmentRepository();
        this.boletoRepository = new BoletoRepository();
        this.boletoService = new BoletoService({
            boletoRepository: this.boletoRepository,
            n8nService: N8nService
        });
        this.service = new InstallmentService({ 
            installmentRepository: this.repository,
            boletoRepository: this.boletoRepository,
            boletoService: this.boletoService,
            n8nService: N8nService
        });
        this.setupRoutes();
    }

    setupRoutes() {
        const routes = installmentRoutes({
            installmentService: this.service
        });
        this.app.use('/installments', routes);
    }

    getRouter() {
        return installmentRoutes({
            installmentService: this.service
        });
    }
}

module.exports = (app) => {
    return new InstallmentModule(app);
};
