const { logger } = require('../../middlewares/logger');
const BaseRepository = require('../../repositories/base/BaseRepository');

class ChatMessageRepository extends BaseRepository {
    constructor() {
        super('chat_messages', 'message_id');
    }

    async findByChatId(chatId, page = 1, limit = 20) {
        const client = await this.pool.connect();
        try {
            const offset = (page - 1) * limit;
            const query = `
                SELECT 
                    m.*,
                    COUNT(*) OVER() as total_count
                FROM chat_messages m
                WHERE m.chat_id = $1
                ORDER BY m.created_at DESC
                LIMIT $2 OFFSET $3
            `;
            const values = [chatId, limit, offset];

            const result = await client.query(query, values);
            const totalItems = parseInt(result.rows[0]?.total_count || 0);
            
            return {
                items: result.rows || [],
                meta: {
                    totalItems,
                    itemCount: result.rows?.length || 0,
                    itemsPerPage: parseInt(limit),
                    totalPages: Math.ceil(totalItems / limit),
                    currentPage: parseInt(page)
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar mensagens do chat', {
                error: error.message,
                chatId,
                page,
                limit
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async createMessage(data) {
        return await this.create(data);
    }

    async updateMessageStatus(messageId, status) {
        return await this.update(messageId, { 
            status,
            updated_at: new Date() 
        });
    }

    async deleteMessage(messageId) {
        return await this.delete(messageId);
    }
}

module.exports = ChatMessageRepository;
