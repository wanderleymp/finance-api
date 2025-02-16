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

    async findByExternalId(externalId) {
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT m.*, c.*, co.contact_value as contact_number
                FROM chat_messages m
                LEFT JOIN chats c ON m.chat_id = c.chat_id
                LEFT JOIN chat_participants cp ON c.chat_id = cp.chat_id
                LEFT JOIN contacts co ON cp.contact_id = co.contact_id
                WHERE m.external_id = $1
                LIMIT 1
            `;
            const values = [externalId];

            const result = await client.query(query, values);
            
            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao buscar mensagem por external_id', {
                error: error.message,
                externalId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async createMessage(data) {
        const client = await this.pool.connect();
        try {
            const query = `
                INSERT INTO chat_messages (
                    chat_id, 
                    content, 
                    content_type,
                    file_url,
                    file_metadata,
                    direction, 
                    status, 
                    external_id, 
                    metadata,
                    channel_id,
                    created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
                ) RETURNING *
            `;
            const values = [
                data.chat_id,
                data.content || '', 
                data.content_type || 'TEXT',
                data.file_url || null,
                JSON.stringify(data.file_metadata || {}),
                data.direction,
                data.status,
                data.external_id,
                JSON.stringify(data.metadata || {}),
                data.channel_id || null,
                data.created_at || new Date()
            ];

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar mensagem', { 
                error: error.message,
                data 
            });
            throw error;
        } finally {
            client.release();
        }
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

    async findChatsByContactId(contactId) {
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT c.chat_id
                FROM chats c
                JOIN chat_participants cp ON c.chat_id = cp.chat_id
                WHERE c.status = 'ACTIVE' AND cp.contact_id = $1
            `;

            const result = await client.query(query, [contactId]);

            return result.rows.map(row => row.chat_id);
        } catch (error) {
            this.logger.error('Erro ao buscar chats por contact_id', {
                error: error.message,
                contactId,
                stack: error.stack
            });
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = ChatMessageRepository;
