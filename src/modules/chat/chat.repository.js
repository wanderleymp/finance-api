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
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT 
                    c.chat_id,
                    c.channel_id,
                    c.status,
                    c.created_at,
                    c.allow_reply,
                    c.is_group,
                    c.is_muted,
                    c.is_pinned,
                    ch.channel_name,
                    ch.channel_id as channel_channel_id,
                    ct.contact_value,
                    ct.contact_id,
                    (
                        SELECT COUNT(*) 
                        FROM chat_messages cm2
                        WHERE cm2.chat_id = c.chat_id 
                        AND cm2.read_at IS NULL
                    ) as unread_count
                FROM 
                    chats c
                LEFT JOIN 
                    channels ch ON c.channel_id = ch.channel_id
                LEFT JOIN
                    contacts ct ON c.contact_id = ct.contact_id
                WHERE 
                    c.chat_id = $1
            `;

            const result = await client.query(query, [id]);

            if (result.rows.length === 0) {
                logger.warn('Chat não encontrado', { chatId: id });
                return null;
            }

            const chatData = result.rows[0];

            logger.info('Chat encontrado', { 
                chatId: chatData.chat_id, 
                channelId: chatData.channel_id 
            });

            return {
                chat_id: chatData.chat_id,
                channel_id: chatData.channel_id,
                channel_name: chatData.channel_name,
                status: chatData.status,
                created_at: chatData.created_at,
                allow_reply: chatData.allow_reply,
                is_group: chatData.is_group,
                is_muted: chatData.is_muted,
                is_pinned: chatData.is_pinned,
                unread_count: chatData.unread_count
            };
        } catch (error) {
            logger.error('Erro ao buscar chat por ID', { 
                error: error.message, 
                chatId: id,
                stack: error.stack
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async findById(id, page = 1, limit = 20) {
        const client = await this.pool.connect();
        try {
            // Consulta para buscar detalhes do chat
            const chatQuery = `
                SELECT 
                    c.chat_id,
                    c.channel_id,
                    c.status,
                    c.created_at,
                    c.allow_reply,
                    c.is_group,
                    c.is_muted,
                    c.is_pinned,
                    ch.channel_name,
                    (
                        SELECT COUNT(*) 
                        FROM chat_messages cm2
                        WHERE cm2.chat_id = c.chat_id 
                        AND cm2.read_at IS NULL
                    ) as unread_count
                FROM 
                    chats c
                LEFT JOIN 
                    channels ch ON c.channel_id = ch.channel_id
                WHERE 
                    c.chat_id = $1
            `;

            const result = await client.query(chatQuery, [id]);

            if (result.rows.length === 0) {
                return null;
            }

            const chatData = result.rows[0];

            return {
                channel_id: chatData.channel_id,
                channel_name: chatData.channel_name,
                chat_id: chatData.chat_id,
                status: chatData.status,
                created_at: chatData.created_at,
                allow_reply: chatData.allow_reply,
                is_group: chatData.is_group,
                is_muted: chatData.is_muted,
                is_pinned: chatData.is_pinned,
                unread_count: chatData.unread_count
            };
        } catch (error) {
            logger.error('Erro ao buscar chat por ID', { 
                error: error.message, 
                chatId: id,
                stack: error.stack
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
