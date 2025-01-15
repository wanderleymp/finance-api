const NfseRoutes = require('./nfse.routes');
const NfseService = require('./nfse.service');
const NfseRepository = require('./nfse.repository');
const NfseController = require('./nfse.controller');
const { logger } = require('../../middlewares/logger');
const axios = require('axios');

class NfseModule {
    constructor() {
        this.repository = new NfseRepository();
        this.service = new NfseService(
            this.repository, 
            axios, 
            {
                get: (key) => {
                    // Configurações padrão ou variáveis de ambiente
                    const configMap = {
                        'NUVEM_FISCAL_TOKEN': process.env.NUVEM_FISCAL_TOKEN,
                        'NUVEM_FISCAL_URL': process.env.NUVEM_FISCAL_URL || 'https://api.nuvemfiscal.com.br/nfse'
                    };
                    return configMap[key];
                }
            }
        );
        this.controller = new NfseController(this.service);
        this.routes = new NfseRoutes(this.controller);
    }

    register(app) {
        logger.info('Registrando módulo de NFSes');
        app.use('/nfses', this.routes.getRouter());
        logger.info('Módulo de NFSes registrado com sucesso');
    }
}

module.exports = new NfseModule();
