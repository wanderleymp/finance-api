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

// Rota para buscar mensagens de um chat específico
router.get('/:chatId/messages', authMiddleware, async (req, res) => {
    try {
        const { chatId } = req.params;
        const { 
            page = 1, 
            limit = 20 
        } = req.query;

        logger.info('Buscando mensagens do chat', { 
            chatId, 
            page, 
            limit 
        });

        const chatMessageService = require('./chat-message.service');
        const messages = await chatMessageService.findByChatId(
            Number(chatId), 
            Number(page), 
            Number(limit)
        );

        logger.info('Mensagens encontradas', { 
            chatId, 
            count: messages.items.length,
            total: messages.meta.totalItems
        });

        res.status(200).json(messages);
    } catch (error) {
        logger.error('Erro ao buscar mensagens do chat', { 
            error: error.message,
            chatId: req.params.chatId
        });

        res.status(500).json({ 
            error: 'Erro interno ao buscar mensagens do chat',
            details: error.message,
            code: 'INTERNAL_ERROR'
        });
    }
});

// Rota para buscar todas as mensagens de chat
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20,
            chatId,
            direction,
            status
        } = req.query;

        // Preparar filtros
        const filters = {};
        if (chatId) filters.chatId = chatId;
        if (direction) filters.direction = direction;
        if (status) filters.status = status;

        logger.info('Buscando mensagens de chat', { 
            page, 
            limit, 
            filters 
        });

        const chatMessageService = require('./chat-message.service');
        const messages = await chatMessageService.findAll(
            Number(page), 
            Number(limit), 
            filters
        );

        logger.info('Mensagens de chat encontradas', { 
            count: messages.items.length,
            total: messages.meta.totalItems
        });

        res.status(200).json(messages);
    } catch (error) {
        logger.error('Erro ao buscar mensagens de chat', { 
            error: error.message,
            query: req.query
        });

        res.status(500).json({ 
            error: 'Erro interno ao buscar mensagens de chat',
            details: error.message,
            code: 'INTERNAL_ERROR'
        });
    }
});

// Rota para criar uma nova mensagem de chat
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { 
            chatId, 
            content, 
            direction = 'OUTBOUND', 
            status = 'SENT', 
            metadata = {} 
        } = req.body;

        // Validações básicas
        if (!chatId) {
            return res.status(400).json({ 
                error: 'ID do chat é obrigatório',
                code: 'MISSING_CHAT_ID'
            });
        }

        if (!content) {
            return res.status(400).json({ 
                error: 'Conteúdo da mensagem é obrigatório',
                code: 'MISSING_CONTENT'
            });
        }

        logger.info('Criando nova mensagem de chat', { 
            chatId, 
            direction, 
            status 
        });

        const chatMessageService = require('./chat-message.service');
        const message = await chatMessageService.createMessage(
            chatId, 
            { 
                content, 
                direction, 
                status, 
                metadata 
            }
        );

        logger.info('Mensagem de chat criada com sucesso', { 
            messageId: message.messageId,
            chatId: message.chatId
        });

        res.status(201).json(message);
    } catch (error) {
        logger.error('Erro ao criar mensagem de chat', { 
            error: error.message,
            body: req.body
        });

        res.status(500).json({ 
            error: 'Erro interno ao criar mensagem de chat',
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

// Nova rota para receber mensagem e vincular/criar chat
router.post('/receive', authMiddleware, async (req, res) => {
    try {
        const { 
            personContactId, 
            content, 
            metadata = {},
            direction = 'INBOUND'
        } = req.body;
        
        logger.info('Recebendo nova mensagem', { personContactId, metadata });
        
        const message = await chatService.receiveMessage(
            personContactId, 
            content, 
            metadata,
            direction
        );
        
        logger.info('Mensagem recebida e processada com sucesso', { 
            messageId: message.message_id,
            chatId: message.chat_id 
        });
        
        res.status(201).json(message);
    } catch (error) {
        logger.error('Erro ao processar mensagem recebida', { 
            error: error.message,
            stack: error.stack,
            body: req.body
        });

        // Tratamento de erros específicos
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
            error: 'Erro interno ao processar mensagem',
            details: error.message,
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;
