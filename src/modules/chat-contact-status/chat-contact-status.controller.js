const { logger } = require('../../middlewares/logger');
const ChatContactStatusService = require('./chat-contact-status.service');

class ChatContactStatusController {
    constructor() {
        this.service = new ChatContactStatusService();
        this.logger = logger;
    }

    async create(req, res) {
        try {
            const result = await this.service.create(req.body);
            res.status(201).json(result);
        } catch (error) {
            this.logger.error('Erro ao criar status do contato', { 
                error: error.message,
                body: req.body
            });
            res.status(500).json({ error: error.message });
        }
    }

    async findByChat(req, res) {
        try {
            const { chatId } = req.params;
            const result = await this.service.findByChat(chatId);
            res.json(result);
        } catch (error) {
            this.logger.error('Erro ao buscar status dos contatos do chat', { 
                error: error.message,
                chatId: req.params.chatId
            });
            res.status(500).json({ error: error.message });
        }
    }

    async findByContact(req, res) {
        try {
            const { contactId } = req.params;
            const result = await this.service.findByContact(contactId);
            res.json(result);
        } catch (error) {
            this.logger.error('Erro ao buscar status do contato', { 
                error: error.message,
                contactId: req.params.contactId
            });
            res.status(500).json({ error: error.message });
        }
    }

    async update(req, res) {
        try {
            const { chatId } = req.params;
            const { contactId } = req.query;
            const result = await this.service.update(chatId, contactId, req.body);
            res.json(result);
        } catch (error) {
            this.logger.error('Erro ao atualizar status do contato', { 
                error: error.message,
                chatId: req.params.chatId,
                contactId: req.query.contactId,
                body: req.body
            });
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = ChatContactStatusController;
