// src/websocket/chat-socket.service.js
const { logger } = require('../middlewares/logger');
const socketService = require('./socket');

/**
 * Serviço para gerenciar eventos de WebSocket relacionados ao chat
 */
class ChatSocketService {
    /**
     * Notifica sobre uma nova mensagem em um chat
     * @param {number} chatId - ID do chat
     * @param {Object} message - Objeto da mensagem
     */
    notifyNewMessage(chatId, message) {
        try {
            socketService.sendMessage(chatId, {
                type: 'NEW_MESSAGE',
                data: message,
                timestamp: new Date().toISOString()
            });
            
            logger.info('Notificação de nova mensagem enviada', { 
                chatId, 
                messageId: message.message_id 
            });
        } catch (error) {
            logger.error('Erro ao notificar nova mensagem', {
                error: error.message,
                chatId,
                messageId: message.message_id
            });
        }
    }
    
    /**
     * Notifica sobre atualização de status de uma mensagem
     * @param {number} chatId - ID do chat
     * @param {number} messageId - ID da mensagem
     * @param {string} status - Novo status da mensagem
     */
    notifyMessageStatusUpdate(chatId, messageId, status) {
        try {
            socketService.updateMessageStatus(chatId, {
                type: 'STATUS_UPDATE',
                data: {
                    messageId,
                    status,
                    timestamp: new Date().toISOString()
                }
            });
            
            logger.info('Notificação de atualização de status enviada', { 
                chatId, 
                messageId,
                status
            });
        } catch (error) {
            logger.error('Erro ao notificar atualização de status', {
                error: error.message,
                chatId,
                messageId,
                status
            });
        }
    }
    
    /**
     * Notifica sobre atualização de status de um chat
     * @param {number} chatId - ID do chat
     * @param {string} status - Novo status do chat
     */
    notifyChatStatusUpdate(chatId, status) {
        try {
            if (!socketService) {
                logger.error('Serviço de socket não inicializado');
                return;
            }
            
            const roomName = `chat:${chatId}`;
            socketService.io?.of('/chats').to(roomName).emit('chatStatus', {
                type: 'CHAT_STATUS',
                data: {
                    chatId,
                    status,
                    timestamp: new Date().toISOString()
                }
            });
            
            logger.info('Notificação de atualização de status do chat enviada', { 
                chatId, 
                status
            });
        } catch (error) {
            logger.error('Erro ao notificar atualização de status do chat', {
                error: error.message,
                chatId,
                status
            });
        }
    }
    
    /**
     * Notifica sobre evento de digitação em um chat
     * @param {number} chatId - ID do chat
     * @param {number} userId - ID do usuário
     * @param {boolean} isTyping - Se o usuário está digitando ou parou
     */
    notifyTypingEvent(chatId, userId, isTyping) {
        try {
            if (!socketService) {
                logger.error('Serviço de socket não inicializado');
                return;
            }
            
            const roomName = `chat:${chatId}`;
            socketService.io?.of('/chats').to(roomName).emit('typing', {
                userId,
                isTyping,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Erro ao notificar evento de digitação', {
                error: error.message,
                chatId,
                userId
            });
        }
    }
}

module.exports = new ChatSocketService();
