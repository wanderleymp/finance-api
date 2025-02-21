const { logger } = require('../../middlewares/logger');
const ChatContactStatusRepository = require('./chat-contact-status.repository');

class ChatContactStatusService {
    constructor() {
        this.repository = new ChatContactStatusRepository();
        this.logger = logger;
    }

    async create(data) {
        try {
            return await this.repository.create({
                chatId: data.chatId,
                contactId: data.contactId,
                status: data.status || 'OFFLINE',
                isTyping: data.isTyping || false,
                lastSeen: data.lastSeen || new Date()
            });
        } catch (error) {
            this.logger.error('Erro ao criar status do contato', { 
                error: error.message,
                data 
            });
            throw error;
        }
    }

    async findByChat(chatId) {
        try {
            return await this.repository.findByChat(chatId);
        } catch (error) {
            this.logger.error('Erro ao buscar status dos contatos do chat', { 
                error: error.message,
                chatId 
            });
            throw error;
        }
    }

    async findByContact(contactId) {
        try {
            return await this.repository.findByContact(contactId);
        } catch (error) {
            this.logger.error('Erro ao buscar status do contato', { 
                error: error.message,
                contactId 
            });
            throw error;
        }
    }

    async update(chatId, contactId, data) {
        try {
            return await this.repository.update(chatId, contactId, {
                status: data.status,
                isTyping: data.isTyping,
                lastSeen: data.lastSeen
            });
        } catch (error) {
            this.logger.error('Erro ao atualizar status do contato', { 
                error: error.message,
                chatId,
                contactId,
                data 
            });
            throw error;
        }
    }
}

module.exports = ChatContactStatusService;
