const { logger } = require('../../middlewares/logger');
const ChatRepository = require('./chat.repository');

class ChatService {
    constructor() {
        this.chatRepository = new ChatRepository();
    }

    async create(chatData) {
        try {
            logger.info('Criando novo chat', { chatData });
            
            const newChat = await this.chatRepository.create(chatData);
            
            logger.info('Chat criado com sucesso', { chatId: newChat.id });
            
            return newChat;
        } catch (error) {
            logger.error('Erro ao criar chat', { 
                error: error.message, 
                chatData 
            });
            throw error;
        }
    }

    async findAll(page = 1, limit = 20, filters = {}) {
        try {
            logger.info('Buscando chats', { page, limit, filters });
            
            const chats = await this.chatRepository.findAll(filters, page, limit);
            
            logger.info('Chats encontrados', { 
                count: chats.items.length, 
                total: chats.meta.totalItems 
            });
            
            return chats;
        } catch (error) {
            logger.error('Erro ao buscar chats', { 
                error: error.message, 
                page, 
                limit, 
                filters 
            });
            throw error;
        }
    }

    async findById(id, page = 1, limit = 20) {
        try {
            logger.info('Buscando chat por ID', { id, page, limit });
            
            const chat = await this.chatRepository.findById(id, page, limit);
            
            if (!chat) {
                logger.warn('Chat não encontrado', { id });
                return null;
            }
            
            logger.info('Chat encontrado com sucesso', { 
                chatId: id,
                messagesCount: chat.messages?.length || 0
            });
            
            return chat;
        } catch (error) {
            logger.error('Erro ao buscar chat por ID', { 
                error: error.message, 
                id,
                page,
                limit
            });
            throw error;
        }
    }
}

module.exports = ChatService;
