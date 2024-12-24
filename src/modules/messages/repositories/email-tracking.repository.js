const { logger } = require('../../../middlewares/logger');
const BaseRepository = require('../../../repositories/base/BaseRepository');

class EmailTrackingRepository extends BaseRepository {
    constructor() {
        super('messages.email_tracking', 'id');
    }

    async createMany(trackings) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const results = [];
            for (const tracking of trackings) {
                const query = `
                    INSERT INTO messages.email_tracking (
                        message_id, chat_message_id, recipient_email,
                        status, metadata
                    ) VALUES ($1, $2, $3, $4, $5)
                    RETURNING *
                `;
                
                const values = [
                    tracking.messageId,
                    tracking.chatMessageId,
                    tracking.recipientEmail,
                    tracking.status || 'PENDING',
                    tracking.metadata || {}
                ];

                const result = await client.query(query, values);
                results.push(result.rows[0]);
            }

            await client.query('COMMIT');
            return results;
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erro ao criar múltiplos trackings', {
                error: error.message,
                trackings
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async updateStatus(messageId, recipientEmail, status, metadata = {}) {
        const client = await this.pool.connect();
        try {
            const timestamp = new Date();
            let updateFields = ['status = $1', 'last_status_update = $2', 'metadata = metadata || $3::jsonb'];
            let values = [status, timestamp, metadata];
            let paramCount = 4;

            // Adiciona timestamps específicos baseado no status
            if (status === 'DELIVERED') {
                updateFields.push('delivered_at = $' + paramCount);
                values.push(timestamp);
                paramCount++;
            } else if (status === 'READ') {
                updateFields.push('read_at = $' + paramCount);
                values.push(timestamp);
                paramCount++;
            }

            const query = `
                UPDATE messages.email_tracking
                SET ${updateFields.join(', ')},
                    updated_at = CURRENT_TIMESTAMP
                WHERE message_id = $${paramCount} AND recipient_email = $${paramCount + 1}
                RETURNING *
            `;
            
            values.push(messageId, recipientEmail);

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar status do tracking', {
                error: error.message,
                messageId,
                recipientEmail,
                status
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async findByMessageAndRecipient(messageId, recipientEmail) {
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT *
                FROM messages.email_tracking
                WHERE message_id = $1 AND recipient_email = $2
            `;
            
            const result = await client.query(query, [messageId, recipientEmail]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar tracking', {
                error: error.message,
                messageId,
                recipientEmail
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async findUnconfirmed(minutes = 30) {
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT *
                FROM messages.email_tracking
                WHERE status IN ('PENDING', 'QUEUED')
                AND created_at < NOW() - INTERVAL '${minutes} minutes'
                ORDER BY created_at ASC
            `;
            
            const result = await client.query(query);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar trackings não confirmados', {
                error: error.message,
                minutes
            });
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = EmailTrackingRepository;
