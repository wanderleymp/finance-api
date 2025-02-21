const express = require('express');
const router = express.Router();
const ChatMessageStatusController = require('./chat-message-status.controller');

// Instancia o controller
const controller = new ChatMessageStatusController();

// Rota para criar/atualizar status de mensagem
router.post('/', async (req, res, next) => {
    try {
        const result = await controller.create(req.body);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
});

// Rota para buscar status por ID da mensagem
router.get('/message/:messageId', async (req, res, next) => {
    try {
        const result = await controller.findByMessageId(req.params.messageId);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Rota para buscar mensagens não lidas de um chat
router.get('/chat/:chatId/unread', async (req, res, next) => {
    try {
        const result = await controller.findUnreadByChat(req.params.chatId, req.query.contactId);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Rota para atualizar status de mensagem
router.put('/message/:messageId/contact/:contactId', async (req, res, next) => {
    try {
        const result = await controller.update(req.params.messageId, req.params.contactId, req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
