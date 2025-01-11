const axios = require('axios');
const { logger } = require('../middlewares/logger');
const { DatabaseError } = require('../utils/errors');

class N8NService {
    constructor() {
        this.baseURL = process.env.N8N_URL;
        this.apiKey = 'ffcaa89a3e19bd98e911475c7974309b';
        this.apiSecret = 'apikey';

        logger.error('Inicialização do N8NService', {
            baseURL: this.baseURL,
            apiKeyLength: this.apiKey.length,
            apiSecretLength: this.apiSecret.length
        });

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
        logger.info('Iniciando _sendRequest', { workflow, payload, payloadType: typeof payload });

        if (!this.baseURL) {
            throw new Error('Base URL do N8N não configurada');
        }

        const apiKey = process.env.N8N_API_KEY || 'ffcaa89a3e19bd98e911475c7974309b';
        const apiSecret = process.env.N8N_API_SECRET?.trim();
        if (!apiKey || !apiSecret) {
            throw new Error('Credenciais do N8N não configuradas');
        }

        // Converte payload para string JSON, se não for string
        const stringPayload = typeof payload === 'string' 
            ? payload 
            : JSON.stringify(payload);

        const url = `${this.baseURL}/${workflow}`;

        // Configuração de headers com autenticação Basic
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
        };

        // Log de segurança
        logger.info(' N8N Request Details', {
            workflow,
            baseUrl: this.baseURL,
            apiKeyLength: apiKey.length,
            apiKeyPrefix: apiKey.substring(0, 3),
            apiKeyLastChars: apiKey.slice(-3), 
            url
        });

        try {
            // Tentativa de request com log detalhado
            const startTime = Date.now();
            
            const response = await axios.post(url, stringPayload, { 
                headers,
                timeout: 10000,
            });

            const duration = Date.now() - startTime;
            
            logger.info(' N8N Request Successful', {
                workflow,
                statusCode: response.status,
                duration: `${duration}ms`
            });

            return response.data;

        } catch (error) {
            // Log de erro detalhado
            logger.error(' N8N Request Error', {
                workflow,
                errorType: error.constructor.name,
                errorMessage: error.message,
                errorResponse: error.response ? {
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers
                } : 'No response',
                requestPayload: stringPayload
            });

            // Lançar erro personalizado
            throw new Error(`Falha na requisição N8N: ${error.message}`);
        }
    }

    /**
     * Cria um boleto no N8N
     */
    async createBoleto(payload) {
        try {
            if (!this.baseURL || !process.env.N8N_API_KEY || !process.env.N8N_API_SECRET) {
                const errorMsg = 'Configurações do N8N incompletas para criação de boleto';
                logger.error(errorMsg, {
                    baseURL: !!this.baseURL,
                    apiKey: !!process.env.N8N_API_KEY,
                    apiSecret: !!process.env.N8N_API_SECRET
                });
                throw new Error(errorMsg);
            }

            const url = `${this.baseURL}/inter/cobranca/emissao`;
            
            // Autenticação Basic usando environment variables
            const authString = `${process.env.N8N_API_KEY || 'ffcaa89a3e19bd98e911475c7974309b'}:${process.env.N8N_API_SECRET}`;
            const encodedAuth = Buffer.from(authString).toString('base64');

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${encodedAuth}`,
                'X-API-KEY': process.env.N8N_API_KEY || 'ffcaa89a3e19bd98e911475c7974309b',
                'X-API-SECRET': process.env.N8N_API_SECRET
            };

            logger.info('Enviando requisição de criação de boleto para N8N', {
                url,
                payloadKeys: Object.keys(payload)
            });

            try {
                const response = await axios.post(url, payload, { headers });
                logger.info('Boleto criado com sucesso no N8N', {
                    statusCode: response.status,
                    responseData: response.data
                });
                return response.data;
            } catch (axiosError) {
                logger.error('Erro ao criar boleto no N8N', {
                    errorMessage: axiosError.message,
                    errorResponse: axiosError.response ? JSON.stringify(axiosError.response.data) : 'Sem resposta',
                    errorStatus: axiosError.response ? axiosError.response.status : 'Sem status',
                    errorHeaders: axiosError.response ? JSON.stringify(axiosError.response.headers) : 'Sem headers'
                });
                throw axiosError;
            }
        } catch (error) {
            logger.error('Erro ao processar criação de boleto no N8N', {
                error: error.message,
                errorStack: error.stack
            });
            throw new DatabaseError('Erro ao criar boleto via N8N');
        }
    }

    /**
     * Cancela um boleto no N8N
     */
    async cancelBoleto(boletoData) {
        logger.info('Enviando requisição de cancelamento de boleto para N8N', {
            payload: boletoData
        });

        // Ajusta o payload para o formato do curl
        const payload = {
            codigoSolicitacao: boletoData.external_boleto_id
        };

        logger.info('Payload gerado para cancelamento de boleto', {
            payload,
            keys: Object.keys(payload),
            codigoSolicitacao: payload.codigoSolicitacao
        });

        try {
            logger.info('Tentativa de cancelamento de boleto', {
                apiKey: this.apiKey,
                apiKeyLength: this.apiKey.length
            });

            const response = await axios.post('https://n8n.webhook.agilefinance.com.br/webhook/inter/cobranca/cancela', payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.apiKey
                }
            });

            logger.info('Resposta do cancelamento de boleto', {
                status: response.status,
                data: response.data
            });

            return response.data;
        } catch (error) {
            logger.error('Erro no cancelamento de boleto', {
                errorMessage: error.message,
                errorResponse: error.response ? error.response.data : 'Sem resposta',
                errorStatus: error.response ? error.response.status : 'Sem status',
                requestHeaders: error.config?.headers
            });

            throw error;
        }
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
