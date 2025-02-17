const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');
const { chatMessageStatusSchema } = require('./chat-message-status.schema');

class ChatMessageStatusRepository extends BaseRepository {
    constructor() {
        super('chat_message_status', 'status_id');
    }

    async findAll(filters = {}, page = 1, limit = 20) {
        const client = await this.pool.connect();
        try {
            const offset = (page - 1) * limit;
            let query = `
                WITH status_details AS (
                    SELECT 
                        cms.*,
                        m.content AS message_content,
                        c.contact_name AS contact_name,
                        COUNT(*) OVER() as total_count
                    FROM chat_message_status cms
                    LEFT JOIN chat_messages m ON cms.message_id = m.message_id
                    LEFT JOIN contacts c ON m.contact_id = c.contact_id
                    WHERE 1=1
            `;
            const values = [];
            let paramCount = 1;

            // Filtro por status
            if (filters.status) {
                query += ` AND cms.status = $${paramCount++}`;
                values.push(filters.status);
            }

            // Filtro por message_id
            if (filters.messageId) {
                query += ` AND cms.message_id = $${paramCount++}`;
                values.push(filters.messageId);
            }

            // Finalizar consulta
            query += `
                ORDER BY cms.status_id DESC
                LIMIT $${paramCount++} OFFSET $${paramCount++}
                )
                SELECT 
                    status_id AS id,
                    message_id AS "messageId",
                    status,
                    occurred_at AS "occurredAt",
                    message_content AS "messageContent",
                    contact_name AS "contactName",
                    total_count AS "totalCount"
                FROM status_details
            `;
            values.push(limit, offset);

            const result = await client.query(query, values);
            const totalItems = parseInt(result.rows[0]?.totalCount || 0);
            
            return {
                items: result.rows.map(row => {
                    const { error } = chatMessageStatusSchema.validate(row);
                    if (error) {
                        logger.warn('Dados inválidos no status de mensagem', { error });
                    }
                    return row;
                }),
                meta: {
                    totalItems,
                    itemCount: result.rows?.length || 0,
                    itemsPerPage: limit,
                    totalPages: Math.ceil(totalItems / limit),
                    currentPage: page
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar status de mensagens', { 
                error: error.message, 
                filters, 
                page, 
                limit 
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async createOrUpdateMessageStatus(messageData) {
        const client = await this.pool.connect();
        try {
            const { message_id, status } = messageData;

            const { error } = chatMessageStatusSchema.validate({ 
                message_id, 
                status 
            });

            if (error) {
                throw new Error(`Dados inválidos: ${error.details[0].message}`);
            }

            const query = `
                INSERT INTO chat_message_status 
                    (message_id, status)
                VALUES 
                    ($1, $2)
                ON CONFLICT (message_id) 
                DO UPDATE SET 
                    status = EXCLUDED.status
                RETURNING *
            `;

            const values = [message_id, status];

            const result = await client.query(query, values);
            
            logger.info('Status de mensagem criado/atualizado', { 
                messageId: message_id, 
                status 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar/atualizar status de mensagem', { 
                error: error.message, 
                messageData 
            });
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = ChatMessageStatusRepository;
