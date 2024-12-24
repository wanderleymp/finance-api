const { logger } = require('../../middlewares/logger');
const { systemDatabase } = require('../../config/database');

class ChatRepository {
    constructor() {
        this.pool = systemDatabase.pool;
    }

    async createChat(personId) {
        const query = `
            INSERT INTO chat_chats (person_id)
            VALUES ($1)
            RETURNING *
        `;
        
        try {
            const { rows } = await this.pool.query(query, [personId]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao criar chat', { error: error.message, personId });
            throw error;
        }
    }

    async createMessage(chatId, direction, content, metadata = {}) {
        const query = `
            INSERT INTO chat_messages (chat_id, direction, content, metadata)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        
        try {
            const { rows } = await this.pool.query(query, [chatId, direction, content, metadata]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao criar mensagem', { error: error.message, chatId });
            throw error;
        }
    }

    async updateMessageStatus(messageId, status) {
        const query = `
            INSERT INTO chat_message_status (message_id, status)
            VALUES ($1, $2)
            RETURNING *
        `;
        
        try {
            const { rows } = await this.pool.query(query, [messageId, status]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar status da mensagem', { error: error.message, messageId, status });
            throw error;
        }
    }

    async findChatByPerson(personId) {
        const query = `
            SELECT c.*, 
                   m.message_id as last_message_id,
                   m.content as last_message_content,
                   m.created_at as last_message_date
            FROM chat_chats c
            LEFT JOIN chat_messages m ON m.message_id = c.last_message_id
            WHERE c.person_id = $1
            ORDER BY c.updated_at DESC
            LIMIT 1
        `;
        
        try {
            const { rows } = await this.pool.query(query, [personId]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao buscar chat por pessoa', { error: error.message, personId });
            throw error;
        }
    }

    async findMessagesByChat(chatId, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const query = `
            SELECT m.*,
                   (SELECT status 
                    FROM chat_message_status ms 
                    WHERE ms.message_id = m.message_id 
                    ORDER BY ms.occurred_at DESC 
                    LIMIT 1) as current_status
            FROM chat_messages m
            WHERE m.chat_id = $1
            ORDER BY m.created_at DESC
            LIMIT $2 OFFSET $3
        `;
        
        try {
            const { rows } = await this.pool.query(query, [chatId, limit, offset]);
            return rows;
        } catch (error) {
            logger.error('Erro ao buscar mensagens do chat', { error: error.message, chatId });
            throw error;
        }
    }

    async updateChatLastMessage(chatId, messageId) {
        const query = `
            UPDATE chat_chats
            SET last_message_id = $2
            WHERE chat_id = $1
            RETURNING *
        `;
        
        try {
            const { rows } = await this.pool.query(query, [chatId, messageId]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar última mensagem do chat', { error: error.message, chatId, messageId });
            throw error;
        }
    }
}

module.exports = ChatRepository;
