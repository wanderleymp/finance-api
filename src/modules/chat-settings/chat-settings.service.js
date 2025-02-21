const ChatSettingsRepository = require('./chat-settings.repository');
const { logger } = require('../../middlewares/logger');

class ChatSettingsService {
    constructor() {
        this.repository = new ChatSettingsRepository();
    }

    async findByChatId(chatId) {
        try {
            return await this.repository.findByChatId(chatId);
        } catch (error) {
            logger.error('Erro ao buscar configurações do chat', {
                error: error.message,
                chatId
            });
            throw error;
        }
    }

    async updateSettings(chatId, settings) {
        try {
            return await this.repository.createOrUpdate(chatId, settings);
        } catch (error) {
            logger.error('Erro ao atualizar configurações do chat', {
                error: error.message,
                chatId,
                settings
            });
            throw error;
        }
    }

    async deleteSettings(chatId) {
        try {
            return await this.repository.delete(chatId);
        } catch (error) {
            logger.error('Erro ao deletar configurações do chat', {
                error: error.message,
                chatId
            });
            throw error;
        }
    }
}

module.exports = ChatSettingsService;
