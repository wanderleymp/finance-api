const { logger } = require('../../../middlewares/logger');
const BaseRepository = require('../../../repositories/base/BaseRepository');

class EmailTrackingRepository extends BaseRepository {
    constructor() {
        super('public.email_tracking', 'tracking_id');
    }

    async createMany(trackings) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const results = [];
            for (const tracking of trackings) {
                const query = `
                    INSERT INTO public.email_tracking (
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
        try {
            const query = `
                UPDATE public.email_tracking 
                SET status = $1, 
                    metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
                    updated_at = CURRENT_TIMESTAMP
                WHERE message_id = $3 AND recipient_email = $4
                RETURNING *
            `;

            const values = [status, metadata, messageId, recipientEmail];
            const result = await this.pool.query(query, values);

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar status do email tracking', {
                error: error.message,
                messageId,
                recipientEmail,
                status,
                metadata
            });
            throw error;
        }
    }

    async findByMessageAndRecipient(messageId, recipientEmail) {
        try {
            const query = `
                SELECT * FROM public.email_tracking
                WHERE message_id = $1 AND recipient_email = $2
            `;

            const values = [messageId, recipientEmail];
            const result = await this.pool.query(query, values);

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar email tracking', {
                error: error.message,
                messageId,
                recipientEmail
            });
            throw error;
        }
    }

    async findUnconfirmed(minutes = 30) {
        try {
            const query = `
                SELECT * FROM public.email_tracking
                WHERE status = 'PENDING'
                AND created_at < NOW() - INTERVAL '${minutes} minutes'
            `;

            const result = await this.pool.query(query);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar emails não confirmados', {
                error: error.message,
                minutes
            });
            throw error;
        }
    }
}

module.exports = EmailTrackingRepository;
