const InstallmentController = require('./installment.controller');
const InstallmentService = require('./installment.service');
const InstallmentRepository = require('./installment.repository');
const installmentRoutes = require('./installment.routes');
const MockCacheService = require('../../services/mockCacheService');

class InstallmentModule {
    constructor() {
        this.repository = new InstallmentRepository();
        this.service = new InstallmentService({ 
            installmentRepository: this.repository,
            cacheService: MockCacheService
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
