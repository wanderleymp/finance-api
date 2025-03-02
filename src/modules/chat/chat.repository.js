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

            // Consulta base otimizada
            const baseQuery = `
                SELECT 
                    c.chat_id as id,
                    COALESCE(ct.contact_name, ct.contact_value, 'Grupo ' || c.chat_id) as name,
                    c.channel_id,
                    cl.channel_name as "channelType",
                    ct.contact_value as "contactValue",
                    ct.contact_id as "lastContactId",
                    COALESCE(ct."profilePicUrl", '') as avatar,
                    json_build_object(
                        'content', COALESCE(cm.content, ''),
                        'type', COALESCE(cm.content_type, 'TEXT'),
                        'fileUrl', cm.file_url,
                        'status', CASE 
                            WHEN cms.status = 'READ' THEN 'READ'
                            WHEN cm.delivered_at IS NOT NULL THEN 'DELIVERED'
                            ELSE 'SENT'
                        END,
                        'timestamp', to_char(cm.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
                    ) as "lastMessage",
                    (
                        SELECT COUNT(*) 
                        FROM chat_messages cm2
                        LEFT JOIN chat_message_status cms2 ON cm2.message_id = cms2.message_id
                        WHERE cm2.chat_id = c.chat_id 
                        AND (cms2.status IS NULL OR cms2.status = 'UNREAD')
                    ) as "unreadCount",
                    c.is_group as "isGroup",
                    COALESCE(c.is_muted, false) as "isMuted",
                    COALESCE(c.is_pinned, false) as "isPinned",
                    'OFFLINE' as "contactStatus"
                FROM chats c
                JOIN (
                    SELECT DISTINCT ON (chat_id) 
                        chat_id,
                        message_id,
                        contact_id,
                        content,
                        content_type,
                        file_url,
                        delivered_at,
                        created_at
                    FROM chat_messages 
                    ORDER BY chat_id, created_at DESC
                ) cm ON c.chat_id = cm.chat_id
                JOIN contacts ct ON cm.contact_id = ct.contact_id
                JOIN channels cl ON c.channel_id = cl.channel_id
                LEFT JOIN chat_message_status cms ON cm.message_id = cms.message_id
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
                    cm.created_at DESC
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
                    c.chat_id as id,
                    COALESCE(ct.contact_name, ct.contact_value, 'Grupo ' || c.chat_id) as name,
                    c.channel_id,
                    cl.channel_name as "channelType",
                    ct.contact_value as "contactValue",
                    ct.contact_id as "lastContactId",
                    COALESCE(ct."profilePicUrl", '') as avatar,
                    json_build_object(
                        'content', COALESCE(cm.content, ''),
                        'type', COALESCE(cm.content_type, 'TEXT'),
                        'fileUrl', cm.file_url,
                        'status', CASE 
                            WHEN cms.status = 'READ' THEN 'READ'
                            WHEN cm.delivered_at IS NOT NULL THEN 'DELIVERED'
                            ELSE 'SENT'
                        END,
                        'timestamp', to_char(cm.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
                    ) as "lastMessage",
                    (
                        SELECT COUNT(*) 
                        FROM chat_messages cm2
                        LEFT JOIN chat_message_status cms2 ON cm2.message_id = cms2.message_id
                        WHERE cm2.chat_id = c.chat_id 
                        AND (cms2.status IS NULL OR cms2.status = 'UNREAD')
                    ) as "unreadCount",
                    c.is_group as "isGroup",
                    COALESCE(c.is_muted, false) as "isMuted",
                    COALESCE(c.is_pinned, false) as "isPinned",
                    'OFFLINE' as "contactStatus"
                FROM chats c
                JOIN (
                    SELECT DISTINCT ON (chat_id) 
                        chat_id,
                        message_id,
                        contact_id,
                        content,
                        content_type,
                        file_url,
                        delivered_at,
                        created_at
                    FROM chat_messages 
                    ORDER BY chat_id, created_at DESC
                ) cm ON c.chat_id = cm.chat_id
                JOIN contacts ct ON cm.contact_id = ct.contact_id
                JOIN channels cl ON c.channel_id = cl.channel_id
                LEFT JOIN chat_message_status cms ON cm.message_id = cms.message_id
                WHERE c.chat_id = $1 AND c.status = 'ACTIVE'
            `;

            const result = await client.query(query, [id]);

            if (result.rows.length === 0) {
                logger.warn('Chat não encontrado', { chatId: id });
                return null;
            }

            const chatData = result.rows[0];

            logger.info('Chat encontrado', { 
                chatId: chatData.id, 
                channelId: chatData.channel_id 
            });

            return chatData;
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
    
    /**
     * Busca um chat pelo ID do contato e ID do canal
     * @param {number} contactId - ID do contato
     * @param {number} channelId - ID do canal
     * @returns {Promise<Object>} - Chat encontrado ou null
     */
    async findByContactAndChannel(contactId, channelId) {
        try {
            const query = `
                SELECT c.*, 
                       ch.channel_name, 
                       co.contact_value,
                       co.contact_name
                FROM chats c
                LEFT JOIN channels ch ON c.channel_id = ch.channel_id
                LEFT JOIN contacts co ON c.contact_id = co.contact_id
                WHERE c.contact_id = $1 AND c.channel_id = $2
                LIMIT 1
            `;
            
            const result = await this.pool.query(query, [contactId, channelId]);
            
            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao buscar chat por contato e canal', { 
                error: error.message, 
                contactId,
                channelId
            });
            throw error;
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
