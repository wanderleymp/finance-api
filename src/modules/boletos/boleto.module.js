const BoletoController = require('./boleto.controller');
const BoletoService = require('./boleto.service');
const BoletoRepository = require('./boleto.repository');
const BoletoProcessor = require('./boleto.processor');
const BoletoRoutes = require('./boleto.routes');
const n8nService = require('../../services/n8n.service');
const MockCacheService = require('../../services/mockCacheService');
const { logger } = require('../../middlewares/logger');

class BoletoModule {
    constructor() {
        this.repository = new BoletoRepository();
        this.processor = new BoletoProcessor({ n8nService });
        this.service = new BoletoService({ 
            boletoRepository: this.repository,
            n8nService,
            taskService: {
                createTask: async (type, data) => {
                    logger.info('Task criada', { type, data });
                    return true;
                }
            },
            cacheService: MockCacheService
        });
        this.controller = new BoletoController({ boletoService: this.service });
    }

    register(app) {
        app.use('/boletos', BoletoRoutes(this.controller));
    }
}

module.exports = new BoletoModule();
