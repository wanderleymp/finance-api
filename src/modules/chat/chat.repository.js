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

            // Consulta base simplificada
            const baseQuery = `
                SELECT 
                    c.chat_id as id,
                    c.status,
                    c.created_at as "createdAt",
                    c.updated_at as "updatedAt",
                    c.channel_id as "channelId",
                    c.allow_reply as "allowReply"
                FROM 
                    chats c
                WHERE 
                    c.status = 'ACTIVE'
            `;

            // Adicionar filtros
            const conditions = [];
            const params = [];
            let paramCount = 1;

            // Filtro seguro para channelId
            if (filters.channelId && typeof filters.channelId === 'number') {
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
                ORDER BY 
                    c.created_at DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            // Query de contagem total
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM chats c 
                WHERE c.status = 'ACTIVE'
                ${conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : ''}
            `;

            // Adicionar parâmetros de paginação
            params.push(limit, offset);

            // Executar consultas
            const [resultQuery, resultCount] = await Promise.all([
                client.query(query, params),
                client.query(countQuery, conditions.length > 0 ? params.slice(0, -2) : [])
            ]);

            const totalItems = parseInt(resultCount.rows[0].total);

            return {
                items: resultQuery.rows,
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

    async findById(id, page = 1, limit = 20) {
        const client = await this.pool.connect();
        try {
            // Consulta para buscar detalhes do chat
            const chatQuery = `
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
                        END,
                        'messages', COALESCE(json_agg(
                            json_build_object(
                                'id', msg.message_id,
                                'content', msg.content,
                                'contentType', msg.content_type,
                                'direction', msg.direction,
                                'createdAt', msg.created_at,
                                'formattedTime', to_char(msg.created_at, 'HH24:MI'),
                                'sender', json_build_object(
                                    'contactId', msg_sender.contact_id,
                                    'contactName', msg_sender.contact_name,
                                    'profilePicUrl', msg_sender."profilePicUrl"
                                )
                            )
                        ) FILTER (WHERE msg.message_id IS NOT NULL), '[]'::json)
                    ) as chat_details
                FROM 
                    chats c
                JOIN 
                    channels cl ON c.channel_id = cl.channel_id
                LEFT JOIN 
                    chat_messages msg ON c.chat_id = msg.chat_id
                LEFT JOIN 
                    contacts msg_sender ON msg.contact_id = msg_sender.contact_id
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
                    c.chat_id = $1
                GROUP BY 
                    c.chat_id, 
                    cl.channel_id, 
                    cm.message_id,
                    cms.message_id,
                    cms.status
            `;

            // Consulta de paginação de mensagens
            const messagesQuery = `
                SELECT 
                    msg.message_id,
                    msg.content,
                    msg.content_type,
                    msg.direction,
                    msg.created_at,
                    to_char(msg.created_at, 'HH24:MI') as formatted_time,
                    msg_sender.contact_id as sender_contact_id,
                    msg_sender.contact_name as sender_contact_name,
                    msg_sender."profilePicUrl" as sender_profile_pic,
                    COUNT(*) OVER() as total_messages
                FROM 
                    chat_messages msg
                LEFT JOIN 
                    contacts msg_sender ON msg.contact_id = msg_sender.contact_id
                WHERE 
                    msg.chat_id = $1
                ORDER BY 
                    msg.created_at DESC
                LIMIT $2 OFFSET $3
            `;

            const offset = (page - 1) * limit;
            const params = [id, limit, offset];

            // Executar consultas
            const [chatResult, messagesResult] = await Promise.all([
                client.query(chatQuery, [id]),
                client.query(messagesQuery, params)
            ]);

            // Verificar se o chat existe
            if (chatResult.rows.length === 0) {
                return null;
            }

            // Preparar resultado
            const chatDetails = chatResult.rows[0].chat_details;
            const totalMessages = parseInt(messagesResult.rows[0]?.total_messages || 0);

            // Adicionar mensagens ao resultado
            chatDetails.messages = messagesResult.rows.map(msg => ({
                id: msg.message_id,
                content: msg.content,
                contentType: msg.content_type,
                direction: msg.direction,
                createdAt: msg.created_at,
                formattedTime: msg.formatted_time,
                sender: {
                    contactId: msg.sender_contact_id,
                    contactName: msg.sender_contact_name,
                    profilePicUrl: msg.sender_profile_pic
                }
            }));

            // Adicionar metadados de paginação
            chatDetails.messagesMeta = {
                totalItems: totalMessages,
                itemCount: messagesResult.rows.length,
                itemsPerPage: limit,
                totalPages: Math.ceil(totalMessages / limit),
                currentPage: page
            };

            return chatDetails;
        } catch (error) {
            logger.error('Erro ao buscar detalhes do chat', { 
                error: error.message, 
                id,
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
