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

            // Consulta base para buscar chats com detalhes completos em JSON
            const baseQuery = `
                SELECT 
                    json_build_object(
                        'chat', json_build_object(
                            'id', c.chat_id,
                            'status', c.status,
                            'createdAt', c.created_at,
                            'updatedAt', c.updated_at,
                            'channelId', c.channel_id,
                            'allowReply', c.allow_reply,
                            'unreadCount', (
                                SELECT COUNT(*) 
                                FROM chat_messages cm 
                                JOIN chat_message_status cms ON cm.message_id = cms.message_id
                                WHERE cm.chat_id = c.chat_id AND cms.status = 'UNREAD'
                            )
                        ),
                        'channel', json_build_object(
                            'id', cl.channel_id,
                            'name', cl.channel_name
                        ),
                        'lastMessage', CASE 
                            WHEN cm.message_id IS NOT NULL THEN json_build_object(
                                'id', cm.message_id,
                                'content', cm.content,
                                'contentType', cm.content_type,
                                'direction', cm.direction,
                                'createdAt', cm.created_at,
                                'formattedTime', to_char(cm.created_at, 'HH24:MI')
                            )
                            ELSE NULL
                        END,
                        'participants', COALESCE(json_agg(
                            json_build_object(
                                'contactId', ct.contact_id,
                                'contactName', ct.contact_name,
                                'contactValue', ct.contact_value,
                                'profilePicUrl', ct."profilePicUrl"
                            )
                        ) FILTER (WHERE ct.contact_id IS NOT NULL), '[]'::json),
                        'messageStatus', CASE 
                            WHEN cms.message_id IS NOT NULL THEN json_build_object(
                                'messageId', cms.message_id,
                                'status', cms.status
                            )
                            ELSE NULL
                        END
                    ) as chat_details
                FROM 
                    chats c
                JOIN 
                    channels cl ON c.channel_id = cl.channel_id
                LEFT JOIN 
                    chat_messages cm ON c.chat_id = cm.chat_id AND cm.created_at = (
                        SELECT MAX(created_at) 
                        FROM chat_messages 
                        WHERE chat_id = c.chat_id
                    )
                LEFT JOIN 
                    chat_participants cp ON c.chat_id = cp.chat_id
                LEFT JOIN 
                    contacts ct ON cp.contact_id = ct.contact_id
                LEFT JOIN 
                    chat_message_status cms ON cm.message_id = cms.message_id
                WHERE 
                    c.status = 'ACTIVE'
            `;

            // Adicionar filtros
            const conditions = [];
            const params = [];
            let paramCount = 1;

            if (filters.channelId) {
                conditions.push(`c.channel_id = $${paramCount}`);
                params.push(filters.channelId);
                paramCount++;
            }

            // Adicionar condições de filtro à consulta
            const whereClause = conditions.length > 0 
                ? 'AND ' + conditions.join(' AND ')
                : '';

            // Query completa com paginação
            const query = `
                ${baseQuery} 
                ${whereClause}
                GROUP BY 
                    c.chat_id, 
                    cl.channel_id, 
                    cm.message_id,
                    cms.message_id,
                    cms.status
                ORDER BY 
                    c.created_at DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            // Query de contagem total
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM chats c 
                WHERE c.status = 'ACTIVE'
                ${whereClause}
            `;

            // Adicionar parâmetros de paginação
            params.push(limit, offset);

            // Executar consultas
            const [resultQuery, resultCount] = await Promise.all([
                client.query(query, params),
                client.query(countQuery, params.slice(0, -2))
            ]);

            const totalItems = parseInt(resultCount.rows[0].total);

            return {
                items: resultQuery.rows.map(row => row.chat_details),
                meta: {
                    totalItems,
                    itemCount: resultQuery.rows.length,
                    itemsPerPage: limit,
                    totalPages: Math.ceil(totalItems / limit),
                    currentPage: page
                }
            };
        } catch (error) {
            logger.error('Erro ao listar chats', { 
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

    async findById(id) {
        const chats = await this.findAll({ id }, 1, 1);
        return chats.items[0] || null;
    }
}

module.exports = ChatRepository;
