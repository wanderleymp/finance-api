const { logger } = require('../../middlewares/logger');
const BaseRepository = require('../../repositories/base/BaseRepository');

class ChatMessageStatusRepository extends BaseRepository {
    constructor() {
        super('chat_message_status', 'message_id');
    }

    async create(data) {
        const client = await this.pool.connect();
        try {
            const query = `
                INSERT INTO ${this.tableName} 
                (message_id, contact_id, status, read_at, created_at, updated_at)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
                ON CONFLICT (message_id, contact_id) 
                DO UPDATE SET 
                    status = EXCLUDED.status,
                    read_at = CASE 
                        WHEN EXCLUDED.status = 'READ' THEN NOW() 
                        ELSE ${this.tableName}.read_at 
                    END,
                    updated_at = NOW()
                RETURNING *
            `;

            const values = [
                data.messageId, 
                data.contactId, 
                data.status, 
                data.status === 'READ' ? new Date() : null
            ];

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar status de mensagem', { 
                error: error.message, 
                data 
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async findByMessageId(messageId) {
        return this.findBy({ message_id: messageId });
    }

    async findUnreadByChat(chatId, contactId) {
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT cms.* FROM ${this.tableName} cms
                JOIN chat_messages cm ON cms.message_id = cm.message_id
                WHERE cm.chat_id = $1 
                AND cms.contact_id != $2
                AND cms.status != 'READ'
            `;

            const result = await client.query(query, [chatId, contactId]);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar mensagens não lidas', { 
                error: error.message, 
                chatId, 
                contactId 
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async update(messageId, contactId, data) {
        const client = await this.pool.connect();
        try {
            const query = `
                UPDATE ${this.tableName}
                SET 
                    status = $3,
                    read_at = CASE 
                        WHEN $3 = 'READ' THEN NOW() 
                        ELSE read_at 
                    END,
                    updated_at = NOW()
                WHERE message_id = $1 AND contact_id = $2
                RETURNING *
            `;

            const values = [
                messageId, 
                contactId, 
                data.status
            ];

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar status da mensagem', { 
                error: error.message, 
                messageId, 
                contactId, 
                data 
            });
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = ChatMessageStatusRepository;
