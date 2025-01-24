const axios = require('axios');
const logger = require('../../utils/logger');

class NuvemFiscalService {
    constructor(config) {
        this.nuvemFiscalUrl = config.nuvemFiscalUrl;
        this.nuvemFiscalApiKey = config.nuvemFiscalApiKey;
        this.ambiente = config.ambiente || 'homologacao';
    }

    async downloadNfsePdf(integrationNfseId, options = {}) {
        try {
            logger.info('Iniciando download de PDF da NFSe na Nuvem Fiscal', { 
                integrationNfseId,
                options 
            });

            const { 
                rodape = '', 
                ambiente = this.ambiente 
            } = options;

            const response = await axios.get(`${this.nuvemFiscalUrl}/nfse/${integrationNfseId}/pdf`, {
                headers: {
                    'Authorization': `Bearer ${this.nuvemFiscalApiKey}`,
                    'Content-Type': 'application/pdf'
                },
                params: {
                    rodape,
                    ambiente
                },
                responseType: 'arraybuffer'
            });

            logger.info('PDF da NFSe baixado com sucesso na Nuvem Fiscal', { 
                integrationNfseId,
                tamanhoArquivo: response.data.byteLength 
            });

            return response.data;
        } catch (error) {
            logger.error('Erro ao baixar PDF da NFSe na Nuvem Fiscal', { 
                integrationNfseId, 
                error: error.message 
            });
            throw error;
        }
    }

    async downloadNfseXml(integrationNfseId, options = {}) {
        try {
            logger.info('Iniciando download de XML da NFSe na Nuvem Fiscal', { 
                integrationNfseId,
                options 
            });

            const { 
                ambiente = this.ambiente 
            } = options;

            const response = await axios.get(`${this.nuvemFiscalUrl}/nfse/${integrationNfseId}/xml`, {
                headers: {
                    'Authorization': `Bearer ${this.nuvemFiscalApiKey}`,
                    'Content-Type': 'application/xml'
                },
                params: {
                    ambiente
                },
                responseType: 'text'
            });

            logger.info('XML da NFSe baixado com sucesso na Nuvem Fiscal', { 
                integrationNfseId,
                tamanhoArquivo: response.data.length 
            });

            return response.data;
        } catch (error) {
            logger.error('Erro ao baixar XML da NFSe na Nuvem Fiscal', { 
                integrationNfseId, 
                error: error.message 
            });
            throw error;
        }
    }
}

module.exports = NuvemFiscalService;
