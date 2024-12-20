const { systemDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');

class TasksRepository {
    constructor() {
        this.pool = systemDatabase.pool;
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const { limit: validLimit, offset } = PaginationHelper.getPaginationParams(page, limit);
            
            let query = `
                SELECT tq.*, tt.name as type_name 
                FROM tasks_queue tq
                JOIN tasks_types tt ON tt.type_id = tq.type_id
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

            // Filtro por status
            if (filters.status) {
                query += ` AND tq.status = $${paramCount}`;
                params.push(filters.status);
                paramCount++;
            }

            // Filtro por tipo
            if (filters.type) {
                query += ` AND tt.name = $${paramCount}`;
                params.push(filters.type);
                paramCount++;
            }

            // Contar total de registros
            const countResult = await this.pool.query(
                query.replace('SELECT tq.*, tt.name as type_name', 'SELECT COUNT(*)'),
                params
            );
            const total = parseInt(countResult.rows[0].count);

            // Adicionar ordenação e paginação
            query += ` ORDER BY tq.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(validLimit, offset);

            const result = await this.pool.query(query, params);

            return {
                data: result.rows,
                total
            };
        } catch (error) {
            logger.error('Erro ao buscar tarefas', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async findById(id) {
        try {
            const result = await this.pool.query(
                `SELECT tq.*, tt.name as type_name 
                 FROM tasks_queue tq
                 JOIN tasks_types tt ON tt.type_id = tq.type_id
                 WHERE tq.task_id = $1`,
                [id]
            );
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar tarefa por ID', {
                errorMessage: error.message,
                errorStack: error.stack,
                taskId: id
            });
            throw error;
        }
    }

    async findAllTypes() {
        try {
            const result = await this.pool.query(
                'SELECT * FROM tasks_types ORDER BY name'
            );
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar tipos de tarefas', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async create(typeId, resourceId, payload = {}) {
        try {
            const result = await this.pool.query(
                `INSERT INTO tasks_queue (type_id, resource_id, payload)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [typeId, resourceId, JSON.stringify(payload)]
            );
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar tarefa', {
                typeId,
                resourceId,
                error: error.message
            });
            throw error;
        }
    }

    async updateStatus(taskId, status, errorMessage = null) {
        try {
            const result = await this.pool.query(
                `UPDATE tasks_queue 
                 SET status = $1,
                     attempts = CASE WHEN $1 = 'processing' THEN attempts + 1 ELSE attempts END,
                     last_attempt = CASE WHEN $1 IN ('completed', 'failed', 'processing') THEN CURRENT_TIMESTAMP ELSE last_attempt END,
                     next_attempt = CASE 
                         WHEN $1 = 'failed' THEN 
                             CURRENT_TIMESTAMP + (
                                 SELECT (retry_delay * attempts) * interval '1 second'
                                 FROM tasks_types 
                                 WHERE type_id = tasks_queue.type_id
                             )
                         ELSE null 
                     END,
                     error_message = $2
                 WHERE task_id = $3
                 RETURNING *`,
                [status, errorMessage, taskId]
            );
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar status da tarefa', {
                taskId,
                status,
                error: error.message
            });
            throw error;
        }
    }

    async getTaskTypeByName(name) {
        try {
            const result = await this.pool.query(
                'SELECT * FROM tasks_types WHERE name = $1',
                [name]
            );
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar tipo de tarefa por nome', {
                name,
                error: error.message
            });
            throw error;
        }
    }

    async getPendingTasks(limit = 10) {
        try {
            const result = await this.pool.query(
                `SELECT tq.*, tt.name as type_name, tt.retry_delay
                 FROM tasks_queue tq
                 JOIN tasks_types tt ON tt.type_id = tq.type_id
                 WHERE tq.status = 'pending'
                    OR (tq.status = 'failed' 
                        AND tq.next_attempt <= CURRENT_TIMESTAMP 
                        AND tq.attempts < tt.max_retries)
                 ORDER BY tq.created_at ASC
                 LIMIT $1`,
                [limit]
            );
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar tarefas pendentes', {
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = new TasksRepository();
