const { logger } = require('../../middlewares/logger');
const BaseRepository = require('../../repositories/base/BaseRepository');

class ChatRepository extends BaseRepository {
    constructor() {
        super('chats', 'chat_id');
    }

    async findAll(filters = {}, page = 1, limit = 20) {
        const client = await this.pool.connect();
        try {
            const offset = (page - 1) * limit;
            let query = `
                SELECT 
                    c.*,
                    cp.person_contact_id as owner_id,
                    ct.contact_value as owner_email,
                    p.full_name as owner_name,
                    lm.content as last_message,
                    lm.created_at as last_message_date,
                    COUNT(*) OVER() as total_count
                FROM chats c
                LEFT JOIN chat_participants cp ON c.chat_id = cp.chat_id AND cp.role = 'OWNER'
                LEFT JOIN person_contacts pc ON cp.person_contact_id = pc.person_contact_id
                LEFT JOIN contacts ct ON pc.contact_id = ct.contact_id AND ct.contact_type = 'email'
                LEFT JOIN persons p ON pc.person_id = p.person_id
                LEFT JOIN chat_messages lm ON c.last_message_id = lm.message_id
                WHERE c.status = 'ACTIVE'
            `;
            const values = [];
            let paramCount = 1;

            // Filtro por pessoa
            if (filters.personContactId) {
                query += ` AND cp.person_contact_id = $${paramCount++}`;
                values.push(filters.personContactId);
            }

            // Ordenação e paginação
            query += ` ORDER BY COALESCE(lm.created_at, c.created_at) DESC`;
            query += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
            values.push(limit, offset);

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
            logger.error('Erro ao listar chats', {
                error: error.message,
                stack: error.stack,
                filters,
                page,
                limit
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async createChat() {
        return await this.create({
            status: 'ACTIVE',
            allow_reply: true
        });
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
        return await this.create({
            chat_id: chatId,
            direction,
            content,
            metadata
        }, 'chat_messages', 'message_id');
    }

    async updateChatLastMessage(chatId, messageId) {
        return await this.update(chatId, {
            last_message_id: messageId
        });
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

    async updateMessageStatus(messageId, status) {
        return await this.update(messageId, {
            metadata: {
                status
            }
        }, 'chat_messages', 'message_id');
    }
}

module.exports = ChatRepository;
