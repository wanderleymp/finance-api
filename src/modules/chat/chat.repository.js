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
                WITH chat_details AS (
                    SELECT 
                        c.chat_id,
                        c.status,
                        c.created_at,
                        c.updated_at,
                        c.channel_id,
                        c.allow_reply,
                        c.last_message_id,
                        lm.content AS last_message_content,
                        lm.content_type AS last_message_type,
                        lm.created_at AS last_message_created_at,
                        lm.contact_id AS last_message_contact_id,
                        lc.contact_name AS last_message_contact_name,
                        (
                            SELECT COUNT(*) 
                            FROM chat_messages cm 
                            LEFT JOIN chat_message_status cms ON cm.message_id = cms.message_id
                            WHERE cm.chat_id = c.chat_id 
                            AND cms.status = 'SENT'
                        ) AS unread_count,
                        (
                            SELECT json_agg(
                                json_build_object(
                                    'contact_id', cp.contact_id,
                                    'contact_name', ct.contact_name,
                                    'role', cp.role,
                                    'status', cp.status
                                )
                            )
                            FROM chat_participants cp
                            JOIN contacts ct ON cp.contact_id = ct.contact_id
                            WHERE cp.chat_id = c.chat_id
                            LIMIT 5
                        ) AS participants,
                        COUNT(*) OVER() as total_count
                    FROM chats c
                    LEFT JOIN chat_messages lm ON c.last_message_id = lm.message_id
                    LEFT JOIN contacts lc ON lm.contact_id = lc.contact_id
                    WHERE 1=1
            `;
            const values = [];
            let paramCount = 1;

            // Filtro por canal
            if (filters.channelId) {
                query += ` AND c.channel_id = $${paramCount++}`;
                values.push(filters.channelId);
            }

            // Filtro por status
            if (filters.status) {
                query += ` AND c.status = $${paramCount++}`;
                values.push(filters.status);
            }

            // Filtro por contato
            if (filters.contactId) {
                query += ` AND EXISTS (
                    SELECT 1 
                    FROM chat_participants cp 
                    WHERE cp.chat_id = c.chat_id 
                    AND cp.contact_id = $${paramCount++}
                )`;
                values.push(filters.contactId);
            }

            // Filtro por data inicial
            if (filters.startDate) {
                query += ` AND c.created_at >= $${paramCount++}`;
                values.push(filters.startDate);
            }

            // Filtro por data final
            if (filters.endDate) {
                query += ` AND c.created_at <= $${paramCount++}`;
                values.push(filters.endDate);
            }

            // Finalizar consulta
            query += `
                ORDER BY COALESCE(lm.created_at, c.created_at) DESC
                LIMIT $${paramCount++} OFFSET $${paramCount++}
                ) 
                SELECT 
                    chat_id AS id,
                    status,
                    created_at AS "createdAt",
                    updated_at AS "updatedAt",
                    channel_id AS "channelId",
                    allow_reply AS "allowReply",
                    last_message_id AS "lastMessageId",
                    last_message_content AS "lastMessageContent",
                    last_message_type AS "lastMessageType",
                    last_message_created_at AS "lastMessageDate",
                    last_message_contact_id AS "lastMessageContactId",
                    last_message_contact_name AS "lastMessageContactName",
                    unread_count AS "unreadCount",
                    participants,
                    total_count AS "totalCount"
                FROM chat_details
            `;
            values.push(limit, offset);

            const result = await client.query(query, values);
            const totalItems = parseInt(result.rows[0]?.totalCount || 0);
            
            return {
                items: result.rows || [],
                meta: {
                    totalItems,
                    itemCount: result.rows?.length || 0,
                    itemsPerPage: limit,
                    totalPages: Math.ceil(totalItems / limit),
                    currentPage: page
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar chats', { 
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
}

module.exports = ChatRepository;
