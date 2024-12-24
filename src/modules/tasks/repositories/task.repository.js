const { logger } = require('../../../middlewares/logger');
const BaseRepository = require('../../../repositories/base/BaseRepository');

class TaskRepository extends BaseRepository {
    constructor() {
        super('tasks', 'id');
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        const client = await this.pool.connect();
        try {
            const offset = (page - 1) * limit;
            let query = `
                SELECT t.*, COUNT(*) OVER() as total_count
                FROM tasks t
                WHERE 1=1
            `;
            const values = [];
            let paramCount = 1;

            if (filters.task_type) {
                query += ` AND task_type = $${paramCount++}`;
                values.push(filters.task_type);
            }

            if (filters.task_status) {
                query += ` AND task_status = $${paramCount++}`;
                values.push(filters.task_status);
            }

            query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
            values.push(limit, offset);

            const result = await client.query(query, values);
            
            return {
                data: result.rows,
                meta: {
                    total: parseInt(result.rows[0]?.total_count || 0),
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar tasks', {
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

    async findPendingTasks(limit = 10) {
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT *
                FROM tasks
                WHERE task_status = 'pending'
                ORDER BY created_at ASC
                LIMIT $1
            `;
            const result = await client.query(query, [limit]);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar tasks pendentes', {
                error: error.message,
                limit
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async updateTaskStatus(taskId, status, error = null) {
        const client = await this.pool.connect();
        try {
            const query = `
                UPDATE tasks
                SET task_status = $1,
                    error_message = $2,
                    updated_at = NOW()
                WHERE id = $3
                RETURNING *
            `;
            const result = await client.query(query, [status, error, taskId]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar status da task', {
                error: error.message,
                taskId,
                status
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async countByStatus(status) {
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT COUNT(*)
                FROM tasks
                WHERE task_status = $1
            `;
            const result = await client.query(query, [status]);
            return parseInt(result.rows[0].count);
        } catch (error) {
            logger.error('Erro ao contar tasks por status', {
                error: error.message,
                status
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async count() {
        const client = await this.pool.connect();
        try {
            const query = `SELECT COUNT(*) FROM tasks`;
            const result = await client.query(query);
            return parseInt(result.rows[0].count);
        } catch (error) {
            logger.error('Erro ao contar total de tasks', {
                error: error.message
            });
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = TaskRepository;
