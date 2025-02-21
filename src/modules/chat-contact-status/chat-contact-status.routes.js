const express = require('express');
const router = express.Router();
const ChatContactStatusController = require('./chat-contact-status.controller');

// Instancia o controller
const controller = new ChatContactStatusController();

// Rota para criar/atualizar status do contato no chat
router.post('/', async (req, res, next) => {
    try {
        const result = await controller.create(req.body);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
});

// Rota para buscar status dos contatos em um chat
router.get('/chat/:chatId', async (req, res, next) => {
    try {
        const result = await controller.findByChat(req.params.chatId);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Rota para buscar status de um contato em todos os chats
router.get('/contact/:contactId', async (req, res, next) => {
    try {
        const result = await controller.findByContact(req.params.contactId);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Rota para atualizar status do contato em um chat
router.put('/chat/:chatId/contact/:contactId', async (req, res, next) => {
    try {
        const result = await controller.update(req.params.chatId, req.params.contactId, req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
