const { logger } = require('../../middlewares/logger');
const ChatMessageStatusService = require('./chat-message-status.service');

class ChatMessageStatusController {
    constructor() {
        this.service = new ChatMessageStatusService();
        this.logger = logger;
    }

    async create(req, res) {
        try {
            const result = await this.service.create(req.body);
            res.status(201).json(result);
        } catch (error) {
            this.logger.error('Erro ao criar status de mensagem', { 
                error: error.message,
                body: req.body
            });
            res.status(500).json({ error: error.message });
        }
    }

    async findByMessageId(req, res) {
        try {
            const { messageId } = req.params;
            const result = await this.service.findByMessageId(messageId);
            res.json(result);
        } catch (error) {
            this.logger.error('Erro ao buscar status da mensagem', { 
                error: error.message,
                messageId: req.params.messageId
            });
            res.status(500).json({ error: error.message });
        }
    }

    async findUnreadByChat(req, res) {
        try {
            const { chatId } = req.params;
            const { contactId } = req.query;
            const result = await this.service.findUnreadByChat(chatId, contactId);
            res.json(result);
        } catch (error) {
            this.logger.error('Erro ao buscar mensagens não lidas', { 
                error: error.message,
                chatId: req.params.chatId,
                contactId: req.query.contactId
            });
            res.status(500).json({ error: error.message });
        }
    }

    async update(req, res) {
        try {
            const { messageId } = req.params;
            const { contactId } = req.query;
            const result = await this.service.update(messageId, contactId, req.body);
            res.json(result);
        } catch (error) {
            this.logger.error('Erro ao atualizar status da mensagem', { 
                error: error.message,
                messageId: req.params.messageId,
                contactId: req.query.contactId,
                body: req.body
            });
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = ChatMessageStatusController;
