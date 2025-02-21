const { logger } = require('../../middlewares/logger');
const ChatMessageStatusRepository = require('./chat-message-status.repository');

class ChatMessageStatusService {
    constructor() {
        this.repository = new ChatMessageStatusRepository();
        this.logger = logger;
    }

    async create(data) {
        try {
            return await this.repository.create({
                messageId: data.messageId,
                contactId: data.contactId,
                status: data.status || 'PENDING'
            });
        } catch (error) {
            this.logger.error('Erro ao criar status de mensagem', { 
                error: error.message,
                data 
            });
            throw error;
        }
    }

    async findByMessageId(messageId) {
        try {
            return await this.repository.findByMessageId(messageId);
        } catch (error) {
            this.logger.error('Erro ao buscar status da mensagem', { 
                error: error.message,
                messageId 
            });
            throw error;
        }
    }

    async findUnreadByChat(chatId, contactId) {
        try {
            return await this.repository.findUnreadByChat(chatId, contactId);
        } catch (error) {
            this.logger.error('Erro ao buscar mensagens não lidas', { 
                error: error.message,
                chatId,
                contactId 
            });
            throw error;
        }
    }

    async update(messageId, contactId, data) {
        try {
            return await this.repository.update(messageId, contactId, {
                status: data.status
            });
        } catch (error) {
            this.logger.error('Erro ao atualizar status da mensagem', { 
                error: error.message,
                messageId,
                contactId,
                data 
            });
            throw error;
        }
    }
}

module.exports = ChatMessageStatusService;
