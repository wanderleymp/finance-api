const ChatSettingsService = require('./chat-settings.service');
const { logger } = require('../../middlewares/logger');

class ChatSettingsController {
    constructor() {
        this.service = new ChatSettingsService();
    }

    async getSettings(req, res) {
        try {
            const { chatId } = req.params;
            logger.info('Buscando configurações do chat', { chatId });

            const settings = await this.service.findByChatId(chatId);
            if (!settings) {
                return res.status(404).json({ 
                    message: 'Configurações do chat não encontradas' 
                });
            }

            return res.json(settings);
        } catch (error) {
            logger.error('Erro ao buscar configurações do chat', {
                error: error.message
            });
            return res.status(500).json({ 
                message: 'Erro ao buscar configurações do chat',
                error: error.message
            });
        }
    }

    async updateSettings(req, res) {
        try {
            const { chatId } = req.params;
            const settings = req.body;
            
            logger.info('Atualizando configurações do chat', { 
                chatId,
                settings 
            });

            const updatedSettings = await this.service.updateSettings(chatId, settings);
            return res.json(updatedSettings);
        } catch (error) {
            logger.error('Erro ao atualizar configurações do chat', {
                error: error.message
            });
            return res.status(500).json({ 
                message: 'Erro ao atualizar configurações do chat',
                error: error.message
            });
        }
    }

    async deleteSettings(req, res) {
        try {
            const { chatId } = req.params;
            logger.info('Deletando configurações do chat', { chatId });

            await this.service.deleteSettings(chatId);
            return res.status(204).send();
        } catch (error) {
            logger.error('Erro ao deletar configurações do chat', {
                error: error.message
            });
            return res.status(500).json({ 
                message: 'Erro ao deletar configurações do chat',
                error: error.message
            });
        }
    }
}

module.exports = ChatSettingsController;
