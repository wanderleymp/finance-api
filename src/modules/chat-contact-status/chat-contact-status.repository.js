const { logger } = require('../../middlewares/logger');
const BaseRepository = require('../../repositories/base/BaseRepository');

class ChatContactStatusRepository extends BaseRepository {
    constructor() {
        super('chat_contact_status', 'chat_id');
    }

    async create(data) {
        const client = await this.pool.connect();
        try {
            const query = `
                INSERT INTO ${this.tableName} 
                (chat_id, contact_id, status, is_typing, last_seen, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                ON CONFLICT (chat_id, contact_id) 
                DO UPDATE SET 
                    status = EXCLUDED.status,
                    is_typing = EXCLUDED.is_typing,
                    last_seen = EXCLUDED.last_seen,
                    updated_at = NOW()
                RETURNING *
            `;

            const values = [
                data.chatId, 
                data.contactId, 
                data.status || 'OFFLINE', 
                data.isTyping || false,
                data.lastSeen || new Date()
            ];

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar status de contato', { 
                error: error.message, 
                data 
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async findByChat(chatId) {
        return this.findBy({ chat_id: chatId });
    }

    async findByContact(contactId) {
        return this.findBy({ contact_id: contactId });
    }

    async update(chatId, contactId, data) {
        const client = await this.pool.connect();
        try {
            const query = `
                UPDATE ${this.tableName}
                SET 
                    status = COALESCE($3, status),
                    is_typing = COALESCE($4, is_typing),
                    last_seen = COALESCE($5, last_seen),
                    updated_at = NOW()
                WHERE chat_id = $1 AND contact_id = $2
                RETURNING *
            `;

            const values = [
                chatId, 
                contactId, 
                data.status,
                data.isTyping,
                data.lastSeen
            ];

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar status do contato', { 
                error: error.message, 
                chatId, 
                contactId, 
                data 
            });
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = ChatContactStatusRepository;
