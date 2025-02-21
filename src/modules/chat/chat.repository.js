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
                    COALESCE(ct.contact_name, 'Grupo ' || c.chat_id) as name,
                    json_build_object(
                        'content', COALESCE(lm.content, ''),
                        'type', COALESCE(lm.content_type, 'TEXT'),
                        'fileUrl', lm.file_url,
                        'status', CASE 
                            WHEN lm.read_at IS NOT NULL THEN 'READ'
                            WHEN lm.delivered_at IS NOT NULL THEN 'DELIVERED'
                            ELSE 'SENT'
                        END,
                        'timestamp', to_char(COALESCE(lm.created_at, c.created_at), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
                    ) as "lastMessage",
                    (SELECT COUNT(*) FROM chat_messages cm2
                     WHERE cm2.chat_id = c.chat_id 
                     AND cm2.read_at IS NULL
                    ) as "unreadCount",
                    COALESCE(ct."profilePicUrl", '') as avatar,
                    c.is_group as "isGroup",
                    c.is_muted as "isMuted",
                    c.is_pinned as "isPinned",
                    ch.channel_name as "channelType"
                FROM 
                    chats c
                LEFT JOIN chat_messages lm ON c.chat_id = lm.chat_id
                    AND lm.created_at = (
                        SELECT MAX(created_at)
                        FROM chat_messages
                        WHERE chat_id = c.chat_id
                    )
                LEFT JOIN contacts ct ON lm.contact_id = ct.contact_id
                LEFT JOIN channels ch ON c.channel_id = ch.channel_id
                WHERE c.status = 'ACTIVE'

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
                            'channelId', c.channel_id,
                            'allowReply', c.allow_reply,
                            'isGroup', c.is_group,
                            'isMuted', c.is_muted,
                            'isPinned', c.is_pinned,
                            'unreadCount', (
                                SELECT COUNT(*) 
                                FROM chat_messages cm2
                                WHERE cm2.chat_id = c.chat_id 
                                AND cm2.read_at IS NULL
                            )
                        ),
                        'channel', json_build_object(
                            'id', ch.channel_id,
                            'name', ch.channel_name
                        ),
                        'lastMessage', CASE 
                            WHEN lm.message_id IS NOT NULL THEN json_build_object(
                                'id', lm.message_id,
                                'content', lm.content,
                                'contentType', lm.content_type,
                                'fileUrl', lm.file_url,
                                'status', CASE 
                                    WHEN lm.read_at IS NOT NULL THEN 'READ'
                                    WHEN lm.delivered_at IS NOT NULL THEN 'DELIVERED'
                                    ELSE 'SENT'
                                END,
                                'createdAt', lm.created_at,
                                'timestamp', to_char(lm.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
                            )
                            ELSE NULL
                        END,
                        'contact', json_build_object(
                            'id', ct.contact_id,
                            'name', ct.contact_name,
                            'avatar', ct."profilePicUrl"
                        )
                    ) as chat_details
                FROM 
                    chats c
                LEFT JOIN 
                    channels ch ON c.channel_id = ch.channel_id
                LEFT JOIN 
                    chat_messages lm ON c.chat_id = lm.chat_id
                    AND lm.created_at = (
                        SELECT MAX(created_at) 
                        FROM chat_messages 
                        WHERE chat_id = c.chat_id
                    )
                LEFT JOIN 
                    contacts ct ON lm.contact_id = ct.contact_id
                WHERE 
                    c.chat_id = $1
            `;

            // Consulta de paginação de mensagens
            const messagesQuery = `
                SELECT 
                    msg.message_id as id,
                    msg.content,
                    msg.content_type as "contentType",
                    msg.file_url as "fileUrl",
                    CASE 
                        WHEN msg.read_at IS NOT NULL THEN 'READ'
                        WHEN msg.delivered_at IS NOT NULL THEN 'DELIVERED'
                        ELSE 'SENT'
                    END as status,
                    msg.created_at as "createdAt",
                    to_char(msg.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as timestamp,
                    json_build_object(
                        'id', ct.contact_id,
                        'name', ct.contact_name,
                        'avatar', ct."profilePicUrl"
                    ) as contact,
                    COUNT(*) OVER() as total_messages
                FROM 
                    chat_messages msg
                LEFT JOIN 
                    contacts ct ON msg.contact_id = ct.contact_id
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
                id: msg.id,
                content: msg.content,
                contentType: msg.contentType,
                fileUrl: msg.fileUrl,
                status: msg.status,
                createdAt: msg.createdAt,
                timestamp: msg.timestamp,
                contact: msg.contact
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

    async findByContactId(contactId, { client = null } = {}) {
        const queryClient = client || this.pool;
        try {
            const query = `
                SELECT 
                    c.chat_id, 
                    c.status, 
                    c.channel_id,
                    c.created_at,
                    c.updated_at
                FROM 
                    chats c
                JOIN 
                    chat_participants cp ON c.chat_id = cp.chat_id
                WHERE 
                    cp.contact_id = $1 AND 
                    c.status = 'ACTIVE'
                ORDER BY 
                    c.created_at DESC
            `;

            const result = await queryClient.query(query, [contactId]);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar chats do contato', { 
                error: error.message, 
                contactId 
            });
            throw error;
        }
    }

    async findOrCreateChatByContactId(contactId, channelId, { client = null } = {}) {
        const queryClient = client || this.pool;
        try {
            // Primeiro, busca chats ativos do contato
            const existingChats = await this.findByContactId(contactId, { client: queryClient });

            if (existingChats.length > 0) {
                return existingChats[0];
            }

            // Se não existir, cria um novo chat
            const newChatQuery = `
                INSERT INTO chats (
                    status, 
                    channel_id, 
                    created_at, 
                    updated_at
                ) VALUES (
                    'ACTIVE', 
                    $1, 
                    NOW(), 
                    NOW()
                ) RETURNING *
            `;

            const newChatResult = await queryClient.query(newChatQuery, [channelId]);
            const newChat = newChatResult.rows[0];

            // Adiciona participante ao chat
            const participantQuery = `
                INSERT INTO chat_participants (
                    chat_id, 
                    contact_id, 
                    created_at
                ) VALUES (
                    $1, 
                    $2, 
                    NOW()
                )
            `;

            await queryClient.query(participantQuery, [newChat.chat_id, contactId]);

            return newChat;
        } catch (error) {
            logger.error('Erro ao encontrar/criar chat do contato', { 
                error: error.message, 
                contactId,
                channelId
            });
            throw error;
        }
    }
}

module.exports = ChatRepository;
