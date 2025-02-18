const { logger } = require('../../middlewares/logger');
const BaseRepository = require('../../repositories/base/BaseRepository');

class ChatMessageRepository extends BaseRepository {
    constructor() {
        super('chat_messages', 'message_id');
    }

    async findByChatId(chatId, page = 1, limit = 20) {
        const client = await this.pool.connect();
        try {
            const offset = (page - 1) * limit;
            const query = `
                SELECT 
                    m.*,
                    COUNT(*) OVER() as total_count
                FROM chat_messages m
                WHERE m.chat_id = $1
                ORDER BY m.created_at DESC
                LIMIT $2 OFFSET $3
            `;
            const values = [chatId, limit, offset];

            const result = await client.query(query, values);
            const totalItems = parseInt(result.rows[0]?.total_count || 0);
            
            return {
                items: result.rows || [],
                meta: {
                    totalItems,
                    itemCount: result.rows?.length || 0,
                    itemsPerPage: parseInt(limit),
                    totalPages: Math.ceil(totalItems / limit),
                    currentPage: parseInt(page)
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar mensagens do chat', {
                error: error.message,
                chatId,
                page,
                limit
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async findMessagesByChat(chatId, page = 1, limit = 20) {
        const client = await this.pool.connect();
        try {
            const offset = (page - 1) * limit;
            const query = `
                SELECT 
                    m.*,
                    COUNT(*) OVER() as total_count
                FROM chat_messages m
                WHERE m.chat_id = $1
                ORDER BY m.created_at DESC
                LIMIT $2 OFFSET $3
            `;
            const values = [chatId, limit, offset];

            const result = await client.query(query, values);
            const totalItems = parseInt(result.rows[0]?.total_count || 0);
            
            return {
                items: result.rows || [],
                meta: {
                    totalItems,
                    itemCount: result.rows?.length || 0,
                    itemsPerPage: parseInt(limit),
                    totalPages: Math.ceil(totalItems / limit),
                    currentPage: parseInt(page)
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar mensagens do chat', {
                error: error.message,
                chatId,
                page,
                limit
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async findByExternalId(externalId) {
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT m.*, c.*, co.contact_value as contact_number
                FROM chat_messages m
                LEFT JOIN chats c ON m.chat_id = c.chat_id
                LEFT JOIN chat_participants cp ON c.chat_id = cp.chat_id
                LEFT JOIN contacts co ON cp.contact_id = co.contact_id
                WHERE m.external_id = $1
                LIMIT 1
            `;
            const values = [externalId];

            const result = await client.query(query, values);
            
            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao buscar mensagem por external_id', {
                error: error.message,
                externalId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async createMessage(data) {
        const client = await this.pool.connect();
        try {
            // Log detalhado dos dados recebidos
            logger.info('DADOS RECEBIDOS PARA CRIAR MENSAGEM', {
                dataFull: JSON.stringify(data, null, 2),
                chatId: data.chat_id,
                contactId: data.contact_id,
                content: data.content ? data.content.substring(0, 50) : 'SEM CONTEÚDO'
            });

            const query = `
                INSERT INTO chat_messages (
                    chat_id, 
                    content, 
                    content_type,
                    file_url,
                    file_metadata,
                    direction, 
                    status, 
                    external_id, 
                    metadata,
                    channel_id,
                    contact_id,
                    created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
                ) RETURNING *
            `;
            const values = [
                data.chat_id,
                data.content || '', 
                data.content_type || 'TEXT',
                data.file_url || null,
                JSON.stringify(data.file_metadata || {}),
                data.direction || 'INCOMING',
                data.status || 'PENDING',
                data.external_id || null,
                JSON.stringify(data.metadata || {}),
                data.channel_id || null,
                data.contact_id || null,
                data.created_at || new Date()
            ];

            const result = await client.query(query, values);
            
            // Log do resultado da criação
            logger.info('MENSAGEM CRIADA COM SUCESSO', {
                messageId: result.rows[0]?.message_id,
                chatId: result.rows[0]?.chat_id,
                content: result.rows[0]?.content ? result.rows[0].content.substring(0, 50) : 'SEM CONTEÚDO'
            });

            return result.rows[0];
        } catch (error) {
            logger.error('ERRO AO CRIAR MENSAGEM', { 
                error: error.message,
                stack: error.stack,
                data: JSON.stringify(data, null, 2)
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async updateMessageStatus(messageId, status) {
        return await this.update(messageId, { 
            status,
            updated_at: new Date() 
        });
    }

    async deleteMessage(messageId) {
        return await this.delete(messageId);
    }

    async findChatsByContactId(contactId) {
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT c.chat_id
                FROM chats c
                JOIN chat_participants cp ON c.chat_id = cp.chat_id
                WHERE c.status = 'ACTIVE' AND cp.contact_id = $1
            `;

            const result = await client.query(query, [contactId]);

            return result.rows.map(row => row.chat_id);
        } catch (error) {
            this.logger.error('Erro ao buscar chats por contact_id', {
                error: error.message,
                contactId,
                stack: error.stack
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async findAll(filters = {}, page = 1, limit = 20) {
        const client = await this.pool.connect();
        try {
            const offset = (page - 1) * limit;

            // Consulta base para buscar mensagens
            const baseQuery = `
                SELECT 
                    cm.message_id as id,
                    cm.chat_id as "chatId",
                    cm.content,
                    cm.content_type as "contentType",
                    cm.direction,
                    cm.status,
                    cm.created_at as "createdAt",
                    
                    c.channel_id as "channelId",
                    ch.channel_name as "channelName",
                    
                    contact.contact_id as "contactId",
                    contact.name as "contactName",
                    contact.phone as "contactPhone"
                FROM chat_messages cm
                LEFT JOIN chats c ON cm.chat_id = c.chat_id
                LEFT JOIN channels ch ON c.channel_id = ch.channel_id
                LEFT JOIN contacts contact ON cm.contact_id = contact.contact_id
                WHERE 1=1
            `;

            // Adicionar filtros
            const conditions = [];
            const params = [];
            let paramCount = 1;

            if (filters.chatId) {
                conditions.push(`cm.chat_id = $${paramCount}`);
                params.push(filters.chatId);
                paramCount++;
            }

            if (filters.contactId) {
                conditions.push(`cm.contact_id = $${paramCount}`);
                params.push(filters.contactId);
                paramCount++;
            }

            if (filters.status) {
                conditions.push(`cm.status = $${paramCount}`);
                params.push(filters.status);
                paramCount++;
            }

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
                ORDER BY cm.created_at DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            // Query de contagem total
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM chat_messages cm
                LEFT JOIN chats c ON cm.chat_id = c.chat_id
                WHERE 1=1
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
            logger.error('Erro ao listar mensagens', { 
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

module.exports = ChatMessageRepository;
