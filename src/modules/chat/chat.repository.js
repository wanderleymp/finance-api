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
                SELECT 
                    c.*,
                    cp.person_contact_id as owner_id,
                    ct.contact_value as owner_email,
                    p.full_name as owner_name,
                    lm.content as last_message,
                    lm.created_at as last_message_date,
                    COUNT(*) OVER() as total_count
                FROM chats c
                LEFT JOIN chat_participants cp ON c.chat_id = cp.chat_id AND cp.role = 'OWNER'
                LEFT JOIN person_contacts pc ON cp.person_contact_id = pc.person_contact_id
                LEFT JOIN contacts ct ON pc.contact_id = ct.contact_id AND ct.contact_type = 'email'
                LEFT JOIN persons p ON pc.person_id = p.person_id
                LEFT JOIN chat_messages lm ON c.last_message_id = lm.message_id
                WHERE 1=1
            `;
            const values = [];
            let paramCount = 1;

            // Filtro por pessoa
            if (filters.personId) {
                query += ` AND cp.person_contact_id = $${paramCount++}`;
                values.push(filters.personId);
            }

            // Filtro por canal
            if (filters.channelId) {
                query += ` AND c.channel_id = $${paramCount++}`;
                values.push(filters.channelId);
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

            // Ordenação e paginação
            query += ` ORDER BY COALESCE(lm.created_at, c.created_at) DESC`;
            query += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
            values.push(limit, offset);

            const result = await client.query(query, values);
            const totalItems = parseInt(result.rows[0]?.total_count || 0);
            
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
