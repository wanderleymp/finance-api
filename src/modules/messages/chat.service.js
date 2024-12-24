const { logger } = require('../../middlewares/logger');
const ChatRepository = require('./chat.repository');
const TaskService = require('../tasks/task.service');

class ChatService {
    constructor() {
        this.chatRepository = new ChatRepository();
        this.taskService = new TaskService();
    }

    async findOrCreateChat(personId) {
        try {
            // Tenta encontrar chat existente
            let chat = await this.chatRepository.findChatByPerson(personId);
            
            // Se não existir, cria novo
            if (!chat) {
                chat = await this.chatRepository.createChat(personId);
                logger.info('Novo chat criado', { personId, chatId: chat.chat_id });
            }

            return chat;
        } catch (error) {
            logger.error('Erro ao buscar/criar chat', { error: error.message, personId });
            throw error;
        }
    }

    async sendMessage(chatId, content, metadata = {}, direction = 'OUTBOUND') {
        try {
            // Cria a mensagem
            const message = await this.chatRepository.createMessage(chatId, direction, content, metadata);
            
            // Atualiza última mensagem do chat
            await this.chatRepository.updateChatLastMessage(chatId, message.message_id);
            
            // Cria task para envio
            await this.taskService.createTask({
                type: 'MESSAGE',
                priority: 'high',
                payload: {
                    messageId: message.message_id,
                    chatId,
                    metadata
                }
            });

            return message;
        } catch (error) {
            logger.error('Erro ao enviar mensagem', { error: error.message, chatId });
            throw error;
        }
    }

    async getMessages(chatId, page = 1, limit = 20) {
        try {
            return await this.chatRepository.findMessagesByChat(chatId, page, limit);
        } catch (error) {
            logger.error('Erro ao buscar mensagens', { error: error.message, chatId });
            throw error;
        }
    }

    async updateMessageStatus(messageId, status) {
        try {
            return await this.chatRepository.updateMessageStatus(messageId, status);
        } catch (error) {
            logger.error('Erro ao atualizar status da mensagem', { error: error.message, messageId, status });
            throw error;
        }
    }

    // Método específico para enviar mensagem de faturamento
    async sendBillingMessage(personId, billingData) {
        try {
            // Encontra ou cria chat
            const chat = await this.findOrCreateChat(personId);
            
            // Cria task específica para mensagem de faturamento
            await this.taskService.createTask({
                type: 'BILLING_MESSAGE',
                priority: 'high',
                payload: {
                    personId,
                    chatId: chat.chat_id,
                    billingData
                }
            });

            logger.info('Task de mensagem de faturamento criada', { 
                personId, 
                chatId: chat.chat_id,
                invoiceNumber: billingData.invoiceNumber 
            });

        } catch (error) {
            logger.error('Erro ao criar mensagem de faturamento', { 
                error: error.message, 
                personId,
                invoiceNumber: billingData?.invoiceNumber 
            });
            throw error;
        }
    }
}

module.exports = ChatService;
