const { logger } = require('../../middlewares/logger');
const BaseRepository = require('../../repositories/base/BaseRepository');

class ChatRepository extends BaseRepository {
    constructor() {
        super('chats', 'chat_id');
    }

    async create(data) {
        const client = await this.pool.connect();
        try {
            const query = `
            INSERT INTO chats (person_id)
            VALUES ($1)
            RETURNING *
            `;
            const values = [data.person_id];

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar chat', {
                error: error.message,
                data
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        const client = await this.pool.connect();
        try {
            const offset = (page - 1) * limit;
            let query = `
                SELECT c.*, p.name as person_name,
                       COUNT(*) OVER() as total_count
                FROM chats c
                LEFT JOIN persons p ON c.person_id = p.person_id
                WHERE 1=1
            `;
            const values = [];
            let paramCount = 1;

            // Filtros
            if (filters.person_id) {
                query += ` AND c.person_id = $${paramCount++}`;
                values.push(filters.person_id);
            }

            if (filters.status) {
                query += ` AND c.status = $${paramCount++}`;
                values.push(filters.status);
            }

            // Ordenação e paginação
            query += `
                ORDER BY c.created_at DESC
                LIMIT $${paramCount++}
                OFFSET $${paramCount++}
            `;
            values.push(limit, offset);

            const result = await client.query(query, values);
            return {
                data: result.rows,
                total: result.rows[0]?.total_count || 0,
                page,
                limit
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

    async update(id, data) {
        const client = await this.pool.connect();
        try {
            const query = `
            UPDATE chats
            SET status = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE chat_id = $2
            RETURNING *
            `;
            const values = [data.status, id];

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar chat', {
                error: error.message,
                id,
                data
            });
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = ChatRepository;
