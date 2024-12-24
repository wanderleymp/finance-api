const { Router } = require('express');
const { logger } = require('../../middlewares/logger');
const ChatService = require('./chat.service');
const auth = require('../../middlewares/auth');

const router = Router();
const chatService = new ChatService();

// Lista mensagens de um chat
router.get('/:chatId/messages', auth, async (req, res) => {
    try {
        const { chatId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        
        const messages = await chatService.getMessages(chatId, page, limit);
        res.json(messages);
    } catch (error) {
        logger.error('Erro ao listar mensagens', { error: error.message });
        res.status(500).json({ error: 'Erro ao listar mensagens' });
    }
});

// Envia mensagem
router.post('/:chatId/messages', auth, async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content, metadata } = req.body;
        
        const message = await chatService.sendMessage(chatId, content, metadata);
        res.status(201).json(message);
    } catch (error) {
        logger.error('Erro ao enviar mensagem', { error: error.message });
        res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
});

// Envia mensagem de faturamento
router.post('/billing/:personId', auth, async (req, res) => {
    try {
        const { personId } = req.params;
        const billingData = req.body;
        
        await chatService.sendBillingMessage(personId, billingData);
        res.status(202).json({ message: 'Mensagem de faturamento será enviada' });
    } catch (error) {
        logger.error('Erro ao enviar mensagem de faturamento', { error: error.message });
        res.status(500).json({ error: 'Erro ao enviar mensagem de faturamento' });
    }
});

module.exports = router;
