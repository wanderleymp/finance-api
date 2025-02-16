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

// Exportar função para registrar rotas
module.exports = (app) => {
    const chatRoutes = new ChatRoutes();
    app.use('/chats', chatRoutes.router);
};
