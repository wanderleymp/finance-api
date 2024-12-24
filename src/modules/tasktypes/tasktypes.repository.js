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
}

module.exports = TaskTypesRepository;
