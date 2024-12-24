const { logger } = require('../../../middlewares/logger');
const BaseRepository = require('../../../repositories/base/BaseRepository');

class TaskTypesRepository extends BaseRepository {
    constructor() {
        super('task_types', 'type_id');
    }

    async findOne(filters = {}) {
        const client = await this.pool.connect();
        try {
            let query = `
                SELECT *
                FROM task_types
                WHERE 1=1
            `;
            const values = [];
            let paramCount = 1;

            // Filtros
            if (filters.name) {
                query += ` AND name = $${paramCount++}`;
                values.push(filters.name);
            }

            if (filters.active !== undefined) {
                query += ` AND active = $${paramCount++}`;
                values.push(filters.active);
            }

            query += ' LIMIT 1';

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar tipo de task', {
                error: error.message,
                filters
            });
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = TaskTypesRepository;
