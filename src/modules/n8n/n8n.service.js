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

    async consultarStatusNfse(integrationNfseId) {
        const url = `https://api.nuvemfiscal.com.br/nfse/${integrationNfseId}`;
        
        this.logger.info('Mock N8N: Consultando status da NFSe', { 
            integrationNfseId,
            url 
        });
        
        // Simula uma chamada ao N8N que consulta a Nuvem Fiscal
        const nuvemFiscalResponse = {
            "@id": integrationNfseId,
            "created_at": new Date().toISOString(),
            "status": "processando",
            "ambiente": "homologacao",
            "referencia": "15",
            "dps": {
                "competencia": "2025-01",
                "valor_servico": 21.00,
                "valor_iss": 0.42
            },
            "mensagens": []
        };

        this.logger.info('Mock N8N: Retorno completo da Nuvem Fiscal', { 
            url,
            integrationNfseId,
            response: nuvemFiscalResponse
        });
        
        // Retorna apenas os campos necessários
        return {
            status: nuvemFiscalResponse.status,
            mensagens: nuvemFiscalResponse.mensagens,
            updated_at: new Date().toISOString()
        };
    }
}

module.exports = new N8NService();
