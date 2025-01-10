const { logger } = require('../../../middlewares/logger');

class LogsRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async create(logData) {
        try {
            const query = `
                INSERT INTO task_logs 
                (task_id, status, metadata, created_at) 
                VALUES ($1, $2, $3, $4) 
                RETURNING *
            `;

            const values = [
                logData.task_id, 
                logData.status || 'pending',
                JSON.stringify(logData.metadata || {}),
                new Date()
            ];

            const result = await this.pool.query(query, values);

            logger.info('LogsRepository: Log de tarefa criado', {
                taskId: logData.task_id,
                status: logData.status
            });

            return result.rows[0];
        } catch (error) {
            logger.error('LogsRepository: Erro ao criar log', {
                error: error.message,
                logData
            });
            throw error;
        }
    }

    async findByTaskId(taskId, limit = 50) {
        try {
            const query = `
                SELECT * FROM task_logs 
                WHERE task_id = $1 
                ORDER BY created_at DESC 
                LIMIT $2
            `;

            const result = await this.pool.query(query, [taskId, limit]);

            return result.rows;
        } catch (error) {
            logger.error('LogsRepository: Erro ao buscar logs', {
                error: error.message,
                taskId
            });
            throw error;
        }
    }
}

module.exports = LogsRepository;
