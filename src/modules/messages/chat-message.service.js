const { logger } = require('../../middlewares/logger');
const ChatMessageRepository = require('./chat-message.repository');
const ChatRepository = require('./chat.repository');

class ChatMessageService {
    constructor() {
        this.chatMessageRepository = new ChatMessageRepository();
        this.chatRepository = new ChatRepository();
    }

    async findByChatId(chatId, page = 1, limit = 20) {
        try {
            logger.info('Buscando mensagens do chat', { chatId, page, limit });
            const messages = await this.chatMessageRepository.findByChatId(chatId, page, limit);
            logger.info('Mensagens encontradas', { count: messages.items.length });
            return messages;
        } catch (error) {
            logger.error('Erro ao buscar mensagens do chat', { 
                error: error.message, 
                chatId 
            });
            throw error;
        }
    }

    async createMessage(chatId, data) {
        try {
            logger.info('Criando nova mensagem', { chatId, data });
            
            // Prepara dados da mensagem
            const messageData = {
                chat_id: chatId,
                content: data.content,
                direction: data.direction || 'OUTBOUND',
                status: data.status || 'SENT',
                metadata: data.metadata || {},
                created_at: new Date()
            };

            // Cria mensagem
            const message = await this.chatMessageRepository.createMessage(messageData);
            
            // Atualiza última mensagem do chat
            await this.chatRepository.updateChatLastMessage(chatId, message.message_id);

            logger.info('Mensagem criada com sucesso', { 
                messageId: message.message_id 
            });

            return message;
        } catch (error) {
            logger.error('Erro ao criar mensagem', { 
                error: error.message, 
                chatId, 
                data 
            });
            throw error;
        }
    }

    async updateMessageStatus(messageId, status) {
        try {
            logger.info('Atualizando status da mensagem', { messageId, status });
            const updatedMessage = await this.chatMessageRepository.updateMessageStatus(messageId, status);
            logger.info('Status da mensagem atualizado', { messageId });
            return updatedMessage;
        } catch (error) {
            logger.error('Erro ao atualizar status da mensagem', { 
                error: error.message, 
                messageId, 
                status 
            });
            throw error;
        }
    }

    async deleteMessage(messageId) {
        try {
            logger.info('Excluindo mensagem', { messageId });
            await this.chatMessageRepository.deleteMessage(messageId);
            logger.info('Mensagem excluída com sucesso', { messageId });
        } catch (error) {
            logger.error('Erro ao excluir mensagem', { 
                error: error.message, 
                messageId 
            });
            throw error;
        }
    }
}

module.exports = ChatMessageService;
