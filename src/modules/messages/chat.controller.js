const { Router } = require('express');
const { logger } = require('../../middlewares/logger');
const ChatService = require('./chat.service');
const { authMiddleware } = require('../../middlewares/auth');

const router = Router();
const chatService = new ChatService();

// Lista todos os chats
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 20, personContactId } = req.query;
        const filters = { personContactId };
        
        logger.info('Listando chats', { page, limit, filters });
        
        const chats = await chatService.findAll(
            parseInt(page), 
            parseInt(limit), 
            filters
        );
        
        logger.info('Chats listados com sucesso', { 
            count: chats.items.length,
            total: chats.meta.totalItems
        });
        
        res.json(chats);
    } catch (error) {
        logger.error('Erro ao listar chats', { 
            error: error.message,
            stack: error.stack,
            query: req.query
        });

        // Mensagens de erro mais específicas
        if (error.message.includes('column') && error.message.includes('does not exist')) {
            return res.status(500).json({ 
                error: 'Erro de estrutura no banco de dados',
                details: error.message,
                code: 'DB_COLUMN_ERROR'
            });
        }

        if (error.message.includes('relation') && error.message.includes('does not exist')) {
            return res.status(500).json({ 
                error: 'Tabela não encontrada no banco de dados',
                details: error.message,
                code: 'DB_TABLE_ERROR'
            });
        }

        if (error.message.includes('permission denied')) {
            return res.status(500).json({ 
                error: 'Erro de permissão no banco de dados',
                details: error.message,
                code: 'DB_PERMISSION_ERROR'
            });
        }

        res.status(500).json({ 
            error: 'Erro interno ao listar chats',
            details: error.message,
            code: 'INTERNAL_ERROR'
        });
    }
});

// Lista mensagens de um chat
router.get('/:chatId/messages', authMiddleware, async (req, res) => {
    try {
        const { chatId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        
        logger.info('Listando mensagens do chat', { chatId, page, limit });
        
        const messages = await chatService.getMessages(chatId, page, limit);
        
        logger.info('Mensagens listadas com sucesso', { 
            count: messages.items.length,
            total: messages.meta.totalItems
        });
        
        res.json(messages);
    } catch (error) {
        logger.error('Erro ao listar mensagens', { 
            error: error.message,
            stack: error.stack,
            params: req.params,
            query: req.query
        });

        // Mensagens de erro mais específicas
        if (error.message.includes('column') && error.message.includes('does not exist')) {
            return res.status(500).json({ 
                error: 'Erro de estrutura no banco de dados',
                details: error.message,
                code: 'DB_COLUMN_ERROR'
            });
        }

        if (error.message.includes('relation') && error.message.includes('does not exist')) {
            return res.status(500).json({ 
                error: 'Tabela não encontrada no banco de dados',
                details: error.message,
                code: 'DB_TABLE_ERROR'
            });
        }

        if (error.message.includes('permission denied')) {
            return res.status(500).json({ 
                error: 'Erro de permissão no banco de dados',
                details: error.message,
                code: 'DB_PERMISSION_ERROR'
            });
        }

        res.status(500).json({ 
            error: 'Erro interno ao listar mensagens',
            details: error.message,
            code: 'INTERNAL_ERROR'
        });
    }
});

// Envia mensagem
router.post('/:chatId/messages', authMiddleware, async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content, metadata } = req.body;
        
        logger.info('Enviando mensagem', { chatId, metadata });
        
        const message = await chatService.sendMessage(chatId, content, metadata);
        
        logger.info('Mensagem enviada com sucesso', { 
            messageId: message.message_id,
            chatId: message.chat_id 
        });
        
        res.status(201).json(message);
    } catch (error) {
        logger.error('Erro ao enviar mensagem', { 
            error: error.message,
            stack: error.stack,
            params: req.params,
            body: req.body
        });

        // Mensagens de erro mais específicas
        if (error.message.includes('column') && error.message.includes('does not exist')) {
            return res.status(500).json({ 
                error: 'Erro de estrutura no banco de dados',
                details: error.message,
                code: 'DB_COLUMN_ERROR'
            });
        }

        if (error.message.includes('relation') && error.message.includes('does not exist')) {
            return res.status(500).json({ 
                error: 'Tabela não encontrada no banco de dados',
                details: error.message,
                code: 'DB_TABLE_ERROR'
            });
        }

        if (error.message.includes('permission denied')) {
            return res.status(500).json({ 
                error: 'Erro de permissão no banco de dados',
                details: error.message,
                code: 'DB_PERMISSION_ERROR'
            });
        }

        res.status(500).json({ 
            error: 'Erro interno ao enviar mensagem',
            details: error.message,
            code: 'INTERNAL_ERROR'
        });
    }
});

// Envia mensagem de faturamento
router.post('/billing/:personId', authMiddleware, async (req, res) => {
    try {
        const { personId } = req.params;
        const billingData = req.body;
        
        logger.info('Enviando mensagem de faturamento', { personId, billingData });
        
        await chatService.sendBillingMessage(personId, billingData);
        
        logger.info('Mensagem de faturamento enviada com sucesso', { 
            personId: personId
        });
        
        res.status(202).json({ message: 'Mensagem de faturamento será enviada' });
    } catch (error) {
        logger.error('Erro ao enviar mensagem de faturamento', { 
            error: error.message,
            stack: error.stack,
            params: req.params,
            body: req.body
        });

        // Mensagens de erro mais específicas
        if (error.message.includes('column') && error.message.includes('does not exist')) {
            return res.status(500).json({ 
                error: 'Erro de estrutura no banco de dados',
                details: error.message,
                code: 'DB_COLUMN_ERROR'
            });
        }

        if (error.message.includes('relation') && error.message.includes('does not exist')) {
            return res.status(500).json({ 
                error: 'Tabela não encontrada no banco de dados',
                details: error.message,
                code: 'DB_TABLE_ERROR'
            });
        }

        if (error.message.includes('permission denied')) {
            return res.status(500).json({ 
                error: 'Erro de permissão no banco de dados',
                details: error.message,
                code: 'DB_PERMISSION_ERROR'
            });
        }

        res.status(500).json({ 
            error: 'Erro interno ao enviar mensagem de faturamento',
            details: error.message,
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;
