const express = require('express');
const { logger } = require('../../middlewares/logger');
const { authMiddleware } = require('../../middlewares/auth');
const ChatService = require('./chat.service');

class ChatRoutes {
    constructor() {
        this.router = express.Router();
        this.chatService = new ChatService();
        this.setupRoutes();
    }

    setupRoutes() {
        // Middleware de autenticação para todas as rotas
        this.router.use(authMiddleware);

        // Middleware de log para todas as rotas
        this.router.use((req, res, next) => {
            logger.info('Requisição de chat recebida', { 
                method: req.method, 
                path: req.path,
                body: req.body 
            });
            next();
        });

        // Rota para enviar mensagem em um chat específico
        this.router.post('/:id/messages', async (req, res) => {
            try {
                const { id } = req.params;
                const messageData = req.body;
                const userId = req.user.id;

                logger.info('Enviando mensagem no chat', {
                    chatId: id,
                    userId,
                    messageData
                });

                const result = await this.chatService.create({
                    chatId: parseInt(id),
                    userId,
                    content: messageData.content,
                    contentType: messageData.contentType,
                    metadata: messageData.metadata,
                    contact_id: messageData.contact_id
                });

                logger.info('Mensagem enviada com sucesso', {
                    chatId: id,
                    result
                });

                res.status(201).json(result);
            } catch (error) {
                this.handleError(res, error, 'Erro ao enviar mensagem no chat');
            }
        });

        // Rota para buscar mensagens de um chat específico
        this.router.get('/:id/messages', async (req, res) => {
            try {
                const { id } = req.params;
                const { page = 1, limit = 20 } = req.query;
                
                logger.info('Buscando mensagens do chat', { 
                    chatId: id, 
                    page, 
                    limit 
                });
                
                // Utilizamos o ChatMessageService para buscar as mensagens
                const chatMessageService = new (require('../messages/chat-message.service'))();
                
                const messages = await chatMessageService.findByChatId(
                    parseInt(id),
                    parseInt(page),
                    parseInt(limit)
                );
                
                logger.info('Mensagens encontradas', { 
                    chatId: id,
                    count: messages.items.length,
                    total: messages.meta.totalItems
                });
                
                res.json(messages);
            } catch (error) {
                this.handleError(res, error, 'Erro ao buscar mensagens do chat');
            }
        });

        // Rota para criar um novo chat
        this.router.post('/', async (req, res) => {
            try {
                const chatData = req.body;
                const newChat = await this.chatService.create(chatData);
                
                logger.info('Chat criado com sucesso', { 
                    chatId: newChat.id 
                });
                
                res.status(201).json(newChat);
            } catch (error) {
                this.handleError(res, error, 'Erro ao criar chat');
            }
        });

        // Rota para listar todos os chats
        this.router.get('/', async (req, res) => {
            try {
                const { 
                    page = 1, 
                    limit = 20, 
                    personId, 
                    channelId, 
                    startDate, 
                    endDate 
                } = req.query;
                
                const filters = {};
                if (personId) filters.personId = parseInt(personId);
                if (channelId) filters.channelId = parseInt(channelId);
                if (startDate) filters.startDate = startDate;
                if (endDate) filters.endDate = endDate;
                
                logger.info('Buscando chats', { 
                    page, 
                    limit, 
                    filters 
                });
                
                const chats = await this.chatService.findAll(
                    parseInt(page), 
                    parseInt(limit), 
                    filters
                );
                
                logger.info('Chats encontrados', { 
                    count: chats.items.length,
                    total: chats.meta.totalItems
                });
                
                res.json(chats);
            } catch (error) {
                this.handleError(res, error, 'Erro ao buscar chats');
            }
        });

        // Rota para buscar chat por ID
        this.router.get('/:id', async (req, res) => {
            try {
                const { id } = req.params;
                
                logger.info('Buscando chat por ID', { chatId: id });
                
                const chat = await this.chatService.findById(parseInt(id));
                
                if (!chat) {
                    return res.status(404).json({ 
                        message: 'Chat não encontrado' 
                    });
                }
                
                res.json(chat);
            } catch (error) {
                this.handleError(res, error, 'Erro ao buscar chat');
            }
        });
        
        // Rota para atualizar status de uma mensagem
        this.router.patch('/:chatId/messages/:messageId/status', async (req, res) => {
            try {
                const { chatId, messageId } = req.params;
                const { status } = req.body;
                
                if (!status) {
                    return res.status(400).json({ 
                        message: 'Status é obrigatório' 
                    });
                }
                
                logger.info('Atualizando status de mensagem', { 
                    chatId, 
                    messageId, 
                    status 
                });
                
                const updatedMessage = await this.chatService.updateMessageStatus(
                    parseInt(chatId),
                    parseInt(messageId),
                    status
                );
                
                res.json(updatedMessage);
            } catch (error) {
                this.handleError(res, error, 'Erro ao atualizar status da mensagem');
            }
        });
        
        // Rota para atualizar status de um chat
        this.router.patch('/:chatId/status', async (req, res) => {
            try {
                const { chatId } = req.params;
                const { status } = req.body;
                
                if (!status) {
                    return res.status(400).json({ 
                        message: 'Status é obrigatório' 
                    });
                }
                
                logger.info('Atualizando status de chat', { 
                    chatId, 
                    status 
                });
                
                const updatedChat = await this.chatService.updateChatStatus(
                    parseInt(chatId),
                    status
                );
                
                res.json(updatedChat);
            } catch (error) {
                this.handleError(res, error, 'Erro ao atualizar status do chat');
            }
        });
        
        // Rota para eventos de digitação
        this.router.post('/:chatId/typing', async (req, res) => {
            try {
                const { chatId } = req.params;
                const { isTyping } = req.body;
                const userId = req.user.id;
                
                if (isTyping === undefined) {
                    return res.status(400).json({ 
                        message: 'isTyping é obrigatório' 
                    });
                }
                
                logger.info('Registrando evento de digitação', { 
                    chatId, 
                    userId, 
                    isTyping 
                });
                
                const result = await this.chatService.registerTypingEvent(
                    parseInt(chatId),
                    userId,
                    isTyping
                );
                
                res.json(result);
            } catch (error) {
                this.handleError(res, error, 'Erro ao registrar evento de digitação');
            }
        });
    }

    // Método para tratamento de erros
    handleError(res, error, message) {
        logger.error(message, { 
            error: error.message, 
            stack: error.stack 
        });
        
        res.status(error.status || 500).json({
            message: message,
            error: error.message
        });
    }
}

// Exportar classe para uso em outros módulos
module.exports = ChatRoutes;

// Exportar função para registrar rotas
module.exports = (app) => {
    const chatRoutes = new ChatRoutes();
    app.use('/chats', chatRoutes.router);
    
    logger.info('Rotas de chat registradas');
};
