const { logger } = require('../../middlewares/logger');
const BaseRepository = require('../../repositories/base/BaseRepository');

class ChatSettingsRepository extends BaseRepository {
    constructor() {
        super('chat_settings', 'chat_id');
    }

    async findByChatId(chatId) {
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT 
                    chat_id as "chatId",
                    is_muted as "isMuted",
                    is_pinned as "isPinned",
                    notification_sound as "notificationSound",
                    created_at as "createdAt"
                FROM ${this.tableName}
                WHERE chat_id = $1
            `;
            const result = await client.query(query, [chatId]);
            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao buscar configurações do chat', { 
                error: error.message,
                chatId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async createOrUpdate(chatId, settings) {
        const client = await this.pool.connect();
        try {
            const query = `
                INSERT INTO ${this.tableName} (
                    chat_id,
                    is_muted,
                    is_pinned,
                    notification_sound
                ) VALUES ($1, $2, $3, $4)
                ON CONFLICT (chat_id) 
                DO UPDATE SET
                    is_muted = EXCLUDED.is_muted,
                    is_pinned = EXCLUDED.is_pinned,
                    notification_sound = EXCLUDED.notification_sound
                RETURNING 
                    chat_id as "chatId",
                    is_muted as "isMuted",
                    is_pinned as "isPinned",
                    notification_sound as "notificationSound",
                    created_at as "createdAt"
            `;
            
            const values = [
                chatId,
                settings.isMuted || false,
                settings.isPinned || false,
                settings.notificationSound
            ];

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar/atualizar configurações do chat', { 
                error: error.message,
                chatId,
                settings
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async delete(chatId) {
        const client = await this.pool.connect();
        try {
            const query = `
                DELETE FROM ${this.tableName}
                WHERE chat_id = $1
                RETURNING chat_id as "chatId"
            `;
            const result = await client.query(query, [chatId]);
            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao deletar configurações do chat', { 
                error: error.message,
                chatId
            });
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = ChatSettingsRepository;
