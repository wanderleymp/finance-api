const { logger } = require('../../middlewares/logger');
const ChannelRepository = require('./channel.repository');

class ChannelService {
    constructor() {
        this.channelRepository = new ChannelRepository();
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            logger.info('Buscando canais', { page, limit, filters });
            const result = await this.channelRepository.findAll(page, limit, filters);
            return result;
        } catch (error) {
            logger.error('Erro ao buscar canais', { 
                error: error.message, 
                page, 
                limit, 
                filters 
            });
            throw error;
        }
    }

    async findById(channelId) {
        try {
            logger.info('Buscando canal por ID', { channelId });
            const channel = await this.channelRepository.findById(channelId);
            
            if (!channel) {
                const error = new Error('Canal não encontrado');
                error.statusCode = 404;
                throw error;
            }

            return channel;
        } catch (error) {
            logger.error('Erro ao buscar canal por ID', { 
                error: error.message, 
                channelId 
            });
            throw error;
        }
    }

    async findByName(channelName) {
        try {
            logger.info('Buscando canal por nome', { channelName });
            const channel = await this.channelRepository.findByName(channelName);
            
            if (!channel) {
                const error = new Error('Canal não encontrado');
                error.statusCode = 404;
                throw error;
            }

            return channel;
        } catch (error) {
            logger.error('Erro ao buscar canal por nome', { 
                error: error.message, 
                channelName 
            });
            throw error;
        }
    }

    async create(data) {
        try {
            logger.info('Criando novo canal', { data });
            
            // Validações básicas
            if (!data.channel_name) {
                const error = new Error('Nome do canal é obrigatório');
                error.statusCode = 400;
                throw error;
            }

            const newChannel = await this.channelRepository.create(data);
            
            logger.info('Canal criado com sucesso', { 
                channel_id: newChannel.channel_id 
            });

            return newChannel;
        } catch (error) {
            logger.error('Erro ao criar canal', { 
                error: error.message, 
                data 
            });
            throw error;
        }
    }

    async update(channelId, data) {
        try {
            logger.info('Atualizando canal', { channelId, data });
            
            // Verifica se canal existe
            await this.findById(channelId);

            const updatedChannel = await this.channelRepository.update(channelId, data);
            
            logger.info('Canal atualizado com sucesso', { 
                channel_id: updatedChannel.channel_id 
            });

            return updatedChannel;
        } catch (error) {
            logger.error('Erro ao atualizar canal', { 
                error: error.message, 
                channelId, 
                data 
            });
            throw error;
        }
    }

    async delete(channelId) {
        try {
            logger.info('Excluindo canal', { channelId });
            
            // Verifica se canal existe
            await this.findById(channelId);

            await this.channelRepository.delete(channelId);
            
            logger.info('Canal excluído com sucesso', { channelId });

            return { message: 'Canal excluído com sucesso' };
        } catch (error) {
            logger.error('Erro ao excluir canal', { 
                error: error.message, 
                channelId 
            });
            throw error;
        }
    }
}

module.exports = ChannelService;
