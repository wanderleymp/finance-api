const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');

class TaskLogsRepository extends BaseRepository {
    constructor() {
        super('task_logs', 'log_id');
    }

    async findByTaskId(taskId, page = 1, limit = 10) {
        const client = await this.pool.connect();
        try {
            // Busca total de registros
            const countQuery = 'SELECT COUNT(*) FROM task_logs WHERE task_id = $1';
            const countResult = await client.query(countQuery, [taskId]);
            const total = parseInt(countResult.rows[0].count);

            // Calcula offset
            const offset = (page - 1) * limit;

            // Busca registros com paginação
            const query = `
                SELECT tl.*, t.name as task_name, t.type_id as task_type_id, t.status as task_status
                FROM task_logs tl
                LEFT JOIN tasks t ON t.task_id = tl.task_id
                WHERE tl.task_id = $1
                ORDER BY tl.created_at DESC
                LIMIT $2 OFFSET $3
            `;
            const result = await client.query(query, [taskId, limit, offset]);

            return {
                items: result.rows.map(row => ({
                    ...row,
                    task: {
                        task_id: row.task_id,
                        name: row.task_name,
                        type_id: row.task_type_id,
                        status: row.task_status
                    }
                })),
                total
            };
        } catch (error) {
            logger.error('Erro ao buscar logs da task', {
                error: error.message,
                taskId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async findByDateRange(startDate, endDate, filters = {}, page = 1, limit = 10) {
        const client = await this.pool.connect();
        try {
            const queryParams = [startDate, endDate];
            let paramCount = 3;
            const conditions = ['created_at BETWEEN $1 AND $2'];

            // Adiciona filtros
            if (filters.task_id) {
                conditions.push(`task_id = $${paramCount}`);
                queryParams.push(filters.task_id);
                paramCount++;
            }
            if (filters.status) {
                conditions.push(`status = $${paramCount}`);
                queryParams.push(filters.status);
                paramCount++;
            }
            if (filters.min_execution_time !== undefined) {
                conditions.push(`execution_time >= $${paramCount}`);
                queryParams.push(filters.min_execution_time);
                paramCount++;
            }
            if (filters.max_execution_time !== undefined) {
                conditions.push(`execution_time <= $${paramCount}`);
                queryParams.push(filters.max_execution_time);
                paramCount++;
            }
            if (filters.has_error !== undefined) {
                conditions.push(filters.has_error ? 'error_message IS NOT NULL' : 'error_message IS NULL');
            }

            // Busca total de registros
            const countQuery = `
                SELECT COUNT(*) 
                FROM task_logs 
                WHERE ${conditions.join(' AND ')}
            `;
            const countResult = await client.query(countQuery, queryParams);
            const total = parseInt(countResult.rows[0].count);

            // Calcula offset
            const offset = (page - 1) * limit;

            // Adiciona limit e offset aos parâmetros
            queryParams.push(limit, offset);

            // Busca registros com paginação
            const query = `
                SELECT tl.*, t.name as task_name, t.type_id as task_type_id, t.status as task_status
                FROM task_logs tl
                LEFT JOIN tasks t ON t.task_id = tl.task_id
                WHERE ${conditions.join(' AND ')}
                ORDER BY tl.created_at DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;
            const result = await client.query(query, queryParams);

            return {
                items: result.rows.map(row => ({
                    ...row,
                    task: {
                        task_id: row.task_id,
                        name: row.task_name,
                        type_id: row.task_type_id,
                        status: row.task_status
                    }
                })),
                total
            };
        } catch (error) {
            logger.error('Erro ao buscar logs por período', {
                error: error.message,
                startDate,
                endDate,
                filters
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async getTaskMetrics(taskId) {
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_executions,
                    COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_executions,
                    COUNT(CASE WHEN status = 'error' THEN 1 END) as failed_executions,
                    AVG(CASE WHEN status = 'success' THEN execution_time END) as avg_execution_time,
                    MAX(execution_time) as max_execution_time,
                    MIN(CASE WHEN status = 'success' THEN execution_time END) as min_execution_time,
                    AVG(retries) as avg_retries,
                    MAX(retries) as max_retries
                FROM task_logs
                WHERE task_id = $1
            `;
            const result = await client.query(query, [taskId]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar métricas da task', {
                error: error.message,
                taskId
            });
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = TaskLogsRepository;
