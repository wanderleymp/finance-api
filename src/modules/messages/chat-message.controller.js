const { Router } = require('express');
const { logger } = require('../../middlewares/logger');
const { authMiddleware } = require('../../middlewares/auth');
const ChatMessageService = require('./chat-message.service');

const router = Router();
const chatMessageService = new ChatMessageService();

// Buscar mensagens de um chat
router.get('/:chatId/messages', authMiddleware, async (req, res) => {
    try {
        const { chatId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        
        logger.info('Buscando mensagens do chat', { chatId, page, limit });
        
        const messages = await chatMessageService.findByChatId(
            chatId, 
            parseInt(page), 
            parseInt(limit)
        );
        
        logger.info('Mensagens encontradas', { 
            count: messages.items.length,
            total: messages.meta.totalItems
        });
        
        res.json(messages);
    } catch (error) {
        logger.error('Erro ao buscar mensagens', { 
            error: error.message,
            stack: error.stack,
            params: req.params,
            query: req.query
        });

        res.status(500).json({ 
            error: 'Erro interno ao buscar mensagens',
            details: error.message,
            code: 'INTERNAL_ERROR'
        });
    }
});

// Criar nova mensagem
router.post('/', authMiddleware, async (req, res) => {
    try {
        // Log detalhado do payload recebido
        logger.info('Requisição de criação de mensagem recebida', { 
            body: JSON.stringify(req.body),
            bodyType: typeof req.body,
            headers: req.headers
        });

        const messageData = req.body;
        
        logger.info('Preparando para criar mensagem', { 
            messageData: JSON.stringify(messageData),
            messageDataType: typeof messageData
        });
        
        const message = await chatMessageService.createMessage(messageData);
        
        logger.info('Mensagem criada com sucesso', { 
            messageId: message.message_id,
            messageDetails: JSON.stringify(message)
        });
        
        res.status(201).json(message);
    } catch (error) {
        logger.error('Erro detalhado ao criar mensagem', { 
            error: error.message,
            errorName: error.name,
            errorDetails: JSON.stringify(error.details || {}),
            stack: error.stack,
            body: JSON.stringify(req.body)
        });

        // Tratamento específico para erro de conteúdo
        if (error.name === 'BusinessError' && error.message === 'Conteúdo da mensagem é obrigatório') {
            return res.status(400).json({ 
                error: error.message,
                code: 'MISSING_CONTENT',
                details: error.details
            });
        }

        res.status(500).json({ 
            error: 'Erro interno ao criar mensagem',
            details: error.message,
            code: 'INTERNAL_ERROR'
        });
    }
});

// Atualizar status da mensagem
router.patch('/:messageId/status', authMiddleware, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { status } = req.body;
        
        logger.info('Atualizando status da mensagem', { messageId, status });
        
        const updatedMessage = await chatMessageService.updateMessageStatus(messageId, status);
        
        logger.info('Status da mensagem atualizado', { 
            messageId,
            newStatus: status 
        });
        
        res.json(updatedMessage);
    } catch (error) {
        logger.error('Erro ao atualizar status da mensagem', { 
            error: error.message,
            stack: error.stack,
            params: req.params,
            body: req.body
        });

        res.status(500).json({ 
            error: 'Erro interno ao atualizar status da mensagem',
            details: error.message,
            code: 'INTERNAL_ERROR'
        });
    }
});

// Excluir mensagem
router.delete('/:messageId', authMiddleware, async (req, res) => {
    try {
        const { messageId } = req.params;
        
        logger.info('Excluindo mensagem', { messageId });
        
        await chatMessageService.deleteMessage(messageId);
        
        logger.info('Mensagem excluída com sucesso', { messageId });
        
        res.status(204).send();
    } catch (error) {
        logger.error('Erro ao excluir mensagem', { 
            error: error.message,
            stack: error.stack,
            params: req.params
        });

        res.status(500).json({ 
            error: 'Erro interno ao excluir mensagem',
            details: error.message,
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;
