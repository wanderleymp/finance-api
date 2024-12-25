const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');

class TaskTypesRepository extends BaseRepository {
    constructor() {
        super('task_types', 'type_id');
    }

    async findByName(name) {
        const client = await this.pool.connect();
        try {
            const query = 'SELECT * FROM task_types WHERE name = $1';
            const result = await client.query(query, [name]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar tipo de task por nome', {
                error: error.message,
                name
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async getActiveTypes() {
        const client = await this.pool.connect();
        try {
            const query = 'SELECT * FROM task_types WHERE active = true ORDER BY name';
            const result = await client.query(query);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar tipos de tasks ativos', {
                error: error.message
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async findAll(filters = {}) {
        try {
            logger.info('TaskTypesRepository: Buscando todos os tipos de tasks', { filters });

            const conditions = [];
            const queryParams = [];
            let paramCount = 1;

            // Adiciona condições de filtro
            for (const [key, value] of Object.entries(filters)) {
                conditions.push(`${key} = $${paramCount}`);
                queryParams.push(value);
                paramCount++;
            }

            const whereClause = conditions.length > 0 
                ? `WHERE ${conditions.join(' AND ')}` 
                : '';

            const query = `
                SELECT type_id, name, description
                FROM task_types
                ${whereClause}
                ORDER BY name
            `;

            const result = await this.pool.query(query, queryParams);

            logger.info('TaskTypesRepository: Tipos de tasks encontrados', {
                totalTypes: result.rowCount,
                types: result.rows.map(t => ({ id: t.type_id, name: t.name }))
            });

            return result.rows;
        } catch (error) {
            logger.error('TaskTypesRepository: Erro ao buscar tipos de tasks', {
                error: error.message,
                filters
            });
            throw error;
        }
    }
}

module.exports = TaskTypesRepository;
