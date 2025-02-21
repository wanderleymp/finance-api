const { logger } = require('../../middlewares/logger');
const BaseRepository = require('../../repositories/base/BaseRepository');
const { EvolutionIntegrationProvider } = require('../../integrations/providers/evolution-api.provider');

class IntegrationService {
    constructor() {
        this.integrationRepository = new BaseRepository('integrations', 'integration_id');
        this.channelRepository = new BaseRepository('channels', 'channel_id');
        this.logger = logger;
    }

    async getChannelConfig(channelId) {
        try {
            // Buscar canal com sua integração
            const channel = await this.channelRepository.findById(channelId);
            if (!channel) {
                throw new Error(`Canal ${channelId} não encontrado`);
            }

            // Se não tiver integration_id, não está configurado
            if (!channel.integration_id) {
                throw new Error(`Canal ${channelId} não possui integração configurada`);
            }

            // Buscar configuração da integração
            const integration = await this.integrationRepository.findById(channel.integration_id);
            if (!integration) {
                throw new Error(`Integração ${channel.integration_id} não encontrada`);
            }

            // Montar configuração usando channel_name como instance
            const config = {
                server_url: integration.config.api_endpoint,
                apikey: integration.config.api_key,
                instance: channel.channel_name
            };

            this.logger.info('Configuração de integração recuperada', {
                channelId,
                integrationId: channel.integration_id,
                instance: config.instance
            });

            return config;
        } catch (error) {
            this.logger.error('Erro ao buscar configuração de integração', {
                error: error.message,
                channelId,
                stack: error.stack
            });
            throw error;
        }
    }

    async setupChannelIntegration(channelId, integrationId) {
        try {
            // Validar se a integração existe
            const integration = await this.integrationRepository.findById(integrationId);
            if (!integration) {
                throw new Error(`Integração ${integrationId} não encontrada`);
            }

            // Atualizar canal com o ID da integração
            await this.channelRepository.update(channelId, {
                integration_id: integrationId
            });

            this.logger.info('Integração do canal configurada', {
                channelId,
                integrationId
            });

            return true;
        } catch (error) {
            this.logger.error('Erro ao configurar integração do canal', {
                error: error.message,
                channelId,
                integrationId,
                stack: error.stack
            });
            throw error;
        }
    }

    async createProvider(channelId) {
        const config = await this.getChannelConfig(channelId);
        return new EvolutionIntegrationProvider(config);
    }
}

module.exports = IntegrationService;
