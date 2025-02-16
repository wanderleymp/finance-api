const { Router } = require('express');
const { logger } = require('../../middlewares/logger');
const ChatMessageService = require('./chat-message.service');
const { authMiddleware } = require('../../middlewares/auth');

class ChatMessagesRoutes {
    constructor(dependencies = {}) {
        this.router = Router();
        this.chatMessageService = dependencies.chatMessageService || new ChatMessageService();
        this.setupRoutes();
    }

    setupRoutes() {
        // Middleware de autenticação para todas as rotas
        this.router.use(authMiddleware);

        // Middleware de log para todas as rotas
        this.router.use((req, res, next) => {
            logger.info('Requisição de chat-messages recebida', {
                method: req.method,
                path: req.path,
                body: req.body,
                params: req.params,
                query: req.query
            });
            next();
        });

        // Busca mensagens de um chat específico
        this.router.get('/:chatId/messages', async (req, res) => {
            try {
                const { chatId } = req.params;
                const { page = 1, limit = 20 } = req.query;
                
                logger.info('Buscando mensagens do chat', { chatId, page, limit });
                
                const messages = await this.chatMessageService.findByChatId(
                    parseInt(chatId), 
                    parseInt(page), 
                    parseInt(limit)
                );
                
                logger.info('Mensagens encontradas', { 
                    count: messages.items.length,
                    total: messages.meta.totalItems
                });
                
                res.json(messages);
            } catch (error) {
                this.handleError(res, error, 'Erro ao buscar mensagens do chat');
            }
        });

        // Lista todas as mensagens
        this.router.get('/', async (req, res) => {
            try {
                const { page = 1, limit = 20, personContactId } = req.query;
                const filters = personContactId ? { personContactId } : {};
                
                logger.info('Listando mensagens', { page, limit, filters });
                
                const messages = await this.chatMessageService.findAll(
                    parseInt(page), 
                    parseInt(limit), 
                    filters
                );
                
                logger.info('Mensagens listadas com sucesso', { 
                    count: messages.items.length,
                    total: messages.meta.totalItems
                });
                
                res.json(messages);
            } catch (error) {
                this.handleError(res, error, 'Erro ao listar mensagens');
            }
        });

        // Criar mensagem
        this.router.post('/', async (req, res) => {
            try {
                const messageData = req.body;
                const userId = req.user.id;
                
                logger.info('Criando nova mensagem', { messageData, userId });
                
                const newMessage = await this.chatMessageService.createMessage({
                    ...messageData,
                    senderId: userId
                });
                
                logger.info('Mensagem criada com sucesso', { messageId: newMessage.id });
                
                res.status(201).json(newMessage);
            } catch (error) {
                this.handleError(res, error, 'Erro ao criar mensagem');
            }
        });

        // Criar mensagem em um chat
        this.router.post('/:chatId/messages', async (req, res) => {
            try {
                const { chatId } = req.params;
                const messageData = req.body;
                const userId = req.user.id;
                
                logger.info('Criando nova mensagem', { chatId, messageData, userId });
                
                const newMessage = await this.chatMessageService.createMessage(
                    parseInt(chatId),
                    {
                        ...messageData,
                        senderId: userId
                    }
                );
                
                logger.info('Mensagem criada com sucesso', { messageId: newMessage.id });
                
                res.status(201).json(newMessage);
            } catch (error) {
                this.handleError(res, error, 'Erro ao criar mensagem');
            }
        });

        // Criar chat de cobrança para um pessoa
        this.router.post('/billing/:personId', async (req, res) => {
            try {
                const { personId } = req.params;
                const billingData = req.body;
                const userId = req.user.id;
                
                logger.info('Criando chat de cobrança', { personId, billingData, userId });
                
                const billingChat = await this.chatMessageService.createBillingChat(
                    parseInt(personId),
                    {
                        ...billingData,
                        createdBy: userId
                    }
                );
                
                logger.info('Chat de cobrança criado com sucesso', { chatId: billingChat.id });
                
                res.status(201).json(billingChat);
            } catch (error) {
                this.handleError(res, error, 'Erro ao criar chat de cobrança');
            }
        });
    }

    // Método para tratamento de erros
    handleError(res, error, logMessage) {
        logger.error(logMessage, { 
            error: error.message,
            stack: error.stack
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

        // Erro genérico
        res.status(500).json({ 
            error: 'Erro interno no servidor',
            details: error.message
        });
    }
}

// Exporta uma função que permite injeção de dependências
module.exports = (dependencies = {}) => {
    const chatMessagesRoutes = new ChatMessagesRoutes(dependencies);
    return chatMessagesRoutes.router;
};
