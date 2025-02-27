const express = require('express');
const { logger } = require('../../middlewares/logger');
const { authMiddleware } = require('../../middlewares/auth');
const ChatMessageService = require('./chat-message.service');
const ChatService = require('../chat/chat.service');
const chatSocketService = require('../../websocket/chat-socket.service');

class ChatMessageRoutes {
    constructor() {
        this.router = express.Router();
        this.chatMessageService = new ChatMessageService();
        this.chatService = new ChatService();
        this.setupRoutes();
    }

    setupRoutes() {
        // Middleware de log para todas as rotas
        this.router.use((req, res, next) => {
            logger.info('Requisição de mensagem recebida', { 
                method: req.method, 
                path: req.path,
                body: req.body 
            });
            next();
        });

        // Rota para receber webhooks de mensagens (sem autenticação)
        this.router.post('/', async (req, res) => {
            try {
                logger.info('Webhook de mensagem recebido', { 
                    data: req.body.data 
                });

                const messageData = req.body.data;
                
                if (!messageData) {
                    return res.status(400).json({ 
                        message: 'Dados da mensagem não fornecidos' 
                    });
                }

                // Processar mensagem recebida
                const result = await this.processIncomingMessage(messageData);
                
                res.status(201).json(result);
            } catch (error) {
                this.handleError(res, error, 'Erro ao processar webhook de mensagem');
            }
        });

        // Rotas autenticadas
        this.router.use(authMiddleware);

        // Rota para listar mensagens de um chat
        this.router.get('/chat/:chatId', async (req, res) => {
            try {
                const { chatId } = req.params;
                const { page = 1, limit = 20 } = req.query;
                
                logger.info('Buscando mensagens do chat', { 
                    chatId, 
                    page, 
                    limit 
                });
                
                const messages = await this.chatMessageService.findByChatId(
                    parseInt(chatId),
                    parseInt(page),
                    parseInt(limit)
                );
                
                res.json(messages);
            } catch (error) {
                this.handleError(res, error, 'Erro ao buscar mensagens do chat');
            }
        });
    }

    async processIncomingMessage(messageData) {
        try {
            // Verificar se é uma mensagem válida
            if (!messageData.text || !messageData.remoteJid) {
                throw new Error('Dados de mensagem inválidos');
            }

            // Extrair número do telefone do remetente
            const phoneNumber = messageData.remoteJid.split('@')[0];
            
            // Buscar ou criar chat e contato
            const chatResult = await this.chatMessageService.findOrCreateChatByPhone(
                phoneNumber,
                messageData.instance,
                messageData.server_url,
                messageData.apikey
            );
            
            if (!chatResult || !chatResult.chat || !chatResult.contact) {
                throw new Error('Não foi possível encontrar ou criar chat/contato');
            }
            
            const { chat, contact } = chatResult;
            
            // Criar objeto de mensagem
            const newMessage = {
                chat_id: chat.chat_id,
                contact_id: contact.contact_id,
                content: messageData.text,
                content_type: 'text',
                direction: 'INBOUND',
                external_id: messageData.id,
                status: {
                    type: 'RECEIVED',
                    timestamp: new Date().toISOString()
                },
                metadata: {
                    instance: messageData.instance,
                    server_url: messageData.server_url,
                    apikey: messageData.apikey,
                    messageType: messageData.messageType,
                    pushName: messageData.pushName
                },
                received_at: new Date().toISOString()
            };
            
            // Salvar mensagem no banco de dados
            const savedMessage = await this.chatMessageService.createMessage(newMessage);
            
            // Notificar via WebSocket
            chatSocketService.notifyNewMessage(chat.chat_id, savedMessage);
            
            logger.info('Mensagem processada e salva com sucesso', { 
                chatId: chat.chat_id,
                messageId: savedMessage.message_id,
                contactId: contact.contact_id
            });
            
            return {
                success: true,
                message: savedMessage
            };
        } catch (error) {
            logger.error('Erro ao processar mensagem recebida', { 
                error: error.message,
                stack: error.stack,
                messageData
            });
            throw error;
        }
    }

    handleError(res, error, message) {
        logger.error(message, { 
            error: error.message, 
            stack: error.stack 
        });
        
        res.status(error.statusCode || 500).json({
            message: message,
            error: error.message
        });
    }
}

// Exportar função para registrar rotas
module.exports = (app) => {
    const chatMessageRoutes = new ChatMessageRoutes();
    app.use('/chat-messages', chatMessageRoutes.router);
    
    logger.info('Rotas de mensagens de chat registradas');
};
