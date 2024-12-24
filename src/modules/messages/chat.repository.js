const { logger } = require('../../middlewares/logger');
const BaseRepository = require('../../repositories/base/BaseRepository');

class ChatRepository extends BaseRepository {
    constructor() {
        super('chats', 'chat_id');
    }

    async createChat() {
        const client = await this.pool.connect();
        try {
            const query = `
            INSERT INTO chats (
                status,
                allow_reply
            )
            VALUES ($1, $2)
            RETURNING *
            `;
            const values = ['ACTIVE', true];

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar chat', {
                error: error.message
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async findChatByPerson(personContactId) {
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT c.*
                FROM chats c
                JOIN chat_participants cp ON c.chat_id = cp.chat_id
                WHERE cp.person_contact_id = $1
                AND cp.role = 'OWNER'
                AND c.status = 'ACTIVE'
                ORDER BY c.created_at DESC
                LIMIT 1
            `;
            const values = [personContactId];

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar chat por pessoa', {
                error: error.message,
                personContactId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async createMessage(chatId, direction, content, metadata = {}) {
        const client = await this.pool.connect();
        try {
            const query = `
            INSERT INTO chat_messages (
                chat_id,
                direction,
                content,
                metadata
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *
            `;
            const values = [chatId, direction, content, metadata];

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar mensagem', {
                error: error.message,
                chatId,
                direction
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async updateChatLastMessage(chatId, messageId) {
        const client = await this.pool.connect();
        try {
            const query = `
                UPDATE chats
                SET last_message_id = $1
                WHERE chat_id = $2
                RETURNING *
            `;
            const values = [messageId, chatId];

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar última mensagem do chat', {
                error: error.message,
                chatId,
                messageId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async findMessagesByChat(chatId, page = 1, limit = 20) {
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
            return {
                data: result.rows,
                total: result.rows[0]?.total_count || 0,
                page,
                limit
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

    async updateMessageStatus(messageId, status) {
        const client = await this.pool.connect();
        try {
            const query = `
                UPDATE chat_messages
                SET metadata = jsonb_set(
                    COALESCE(metadata, '{}'::jsonb),
                    '{status}',
                    $1::jsonb
                )
                WHERE message_id = $2
                RETURNING *
            `;
            const values = [JSON.stringify(status), messageId];

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar status da mensagem', {
                error: error.message,
                messageId,
                status
            });
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = ChatRepository;
