const InstallmentController = require('./installment.controller');
const InstallmentService = require('./installment.service');
const InstallmentRepository = require('./installment.repository');
const BoletoRepository = require('../boletos/boleto.repository');
const BoletoService = require('../boletos/boleto.service');
const installmentRoutes = require('./installment.routes');
const MockCacheService = require('../../services/mockCacheService');
const N8nService = require('../../services/n8n.service');

class InstallmentModule {
    constructor() {
        this.repository = new InstallmentRepository();
        this.boletoRepository = new BoletoRepository();
        this.boletoService = new BoletoService({
            boletoRepository: this.boletoRepository,
            n8nService: N8nService
        });
        this.service = new InstallmentService({ 
            installmentRepository: this.repository,
            cacheService: MockCacheService,
            boletoRepository: this.boletoRepository,
            boletoService: this.boletoService,
            n8nService: N8nService
        });
        this.controller = new InstallmentController({ 
            installmentService: this.service 
        });
    }

    register(app) {
        app.use('/installments', installmentRoutes(this.controller));
    }
}

module.exports = new InstallmentModule();
