const axios = require('axios');
const { logger } = require('../../middlewares/logger');

class IntegrationError extends Error {
    constructor(details) {
        super(details.message);
        this.name = 'IntegrationError';
        this.details = details;
    }
}

class EvolutionApiClient {
    constructor(config) {
        this.config = config;
        this.logger = logger;
        this.httpClient = axios.create({
            baseURL: config.baseUrl,
            headers: {
                'apikey': config.apiKey,
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            }
        });
    }

    async sendMessage(params) {
        try {
            const { number, text, delay = 1200, linkPreview = true } = params;

            const endpoint = `/message/sendText/${this.config.instance}`;
            const payload = {
                number,
                text,
                delay,
                linkPreview
            };

            this.logger.info('Enviando mensagem via Evolution API', {
                number,
                text,
                instance: this.config.instance
            });

            const response = await this.httpClient.post(endpoint, payload);

            return {
                messageId: response.data.key?.id || response.data.messageId,
                status: response.data.status || 'sent',
                providerResponse: response.data
            };
        } catch (error) {
            this.logger.error('Erro ao enviar mensagem via Evolution API', {
                error: error.message,
                response: error.response?.data
            });

            throw new IntegrationError({
                provider: 'EVOLUTION_API',
                message: 'Falha ao enviar mensagem',
                status: error.response?.status,
                originalError: error,
                data: error.response?.data
            });
        }
    }
}

class EvolutionIntegrationProvider {
    constructor(credentials) {
        this.validateCredentials(credentials);

        this.apiClient = new EvolutionApiClient({
            baseUrl: credentials.server_url,
            apiKey: credentials.apikey,
            instance: credentials.instance
        });
    }

    validateCredentials(credentials) {
        if (!credentials.server_url) {
            throw new Error('server_url é obrigatório');
        }
        if (!credentials.apikey) {
            throw new Error('apikey é obrigatório');
        }
        if (!credentials.instance) {
            throw new Error('instance é obrigatório');
        }
    }

    async send(params) {
        return this.apiClient.sendMessage(params);
    }
}

module.exports = {
    EvolutionIntegrationProvider,
    IntegrationError
};
