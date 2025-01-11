const axios = require('axios');
const { logger } = require('../middlewares/logger');
const { BusinessError } = require('../utils/errors');

class N8NService {
    constructor() {
        this.baseURL = process.env.N8N_URL;
        this.apiKey = process.env.N8N_API_KEY;
        this.apiSecret = process.env.N8N_API_SECRET;

        if (!this.baseURL || !this.apiKey || !this.apiSecret) {
            logger.warn('Configurações incompletas do N8N', {
                baseURL: !!this.baseURL,
                apiKey: !!this.apiKey,
                apiSecret: !!this.apiSecret
            });
        }
    }

    /**
     * Envia uma requisição para o N8N
     * @private
     */
    async _sendRequest(workflow, payload) {
        try {
            if (!this.baseURL || !this.apiKey || !this.apiSecret) {
                throw new Error('Configurações do N8N incompletas');
            }

            const url = `${this.baseURL}/${workflow}`;
            const response = await axios.post(url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': this.apiKey,
                    'X-API-SECRET': this.apiSecret
                }
            });

            logger.info('Requisição N8N enviada com sucesso', {
                workflow,
                statusCode: response.status
            });

            return response.data;
        } catch (error) {
            logger.error('Erro ao enviar requisição para N8N', {
                workflow,
                error: error.message,
                errorStack: error.stack
            });
            throw new BusinessError('Erro ao processar requisição no N8N');
        }
    }

    /**
     * Cria um boleto no N8N
     */
    async createBoleto(boletoData) {
        logger.info('Enviando requisição de criação de boleto para N8N', {
            payload: boletoData
        });

        return this._sendRequest('inter/cobranca/emissao', boletoData);
    }

    /**
     * Cancela um boleto no N8N
     */
    async cancelBoleto(boletoData) {
        logger.info('Enviando requisição de cancelamento de boleto para N8N', {
            boletoId: boletoData.boleto_id
        });

        return this._sendRequest('cancel-boleto', boletoData);
    }

    /**
     * Envia uma mensagem via N8N
     */
    async sendMessage(messageData) {
        logger.info('Enviando requisição de mensagem para N8N', {
            type: messageData.type
        });

        return this._sendRequest('send-message', messageData);
    }
}

// Singleton para reutilizar a mesma instância
module.exports = new N8NService();
