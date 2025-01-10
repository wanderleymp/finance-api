const { logger } = require('../../middlewares/logger');

class N8NService {
    constructor() {
        this.logger = logger;
    }

    async createBoleto(payload) {
        this.logger.info('Mock N8N: Criando boleto', { payload });
        
        // Simula uma chamada ao N8N
        return {
            url: `https://banco.exemplo.com.br/boletos/${payload.boleto_id}`,
            linha_digitavel: '23793.38128 60007.827136 95000.063305 9 84350000024950',
            nosso_numero: `${payload.boleto_id}`.padStart(8, '0')
        };
    }
}

module.exports = new N8NService();
