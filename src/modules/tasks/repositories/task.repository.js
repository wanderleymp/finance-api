const { logger } = require('../../../middlewares/logger');
const BaseRepository = require('../../../repositories/base/BaseRepository');

class TaskRepository extends BaseRepository {
    constructor() {
        super('tasks', 'task_id');
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        const client = await this.pool.connect();
        try {
            const offset = (page - 1) * limit;
            let query = `
                SELECT t.*, tt.name as type_name, tt.description as type_description,
                       array_agg(DISTINCT td.dependency_id) as dependencies,
                       COUNT(*) OVER() as total_count
                FROM tasks t
                JOIN task_types tt ON t.type_id = tt.type_id
                LEFT JOIN task_dependencies td ON t.task_id = td.task_id
                WHERE 1=1
            `;
            const values = [];
            let paramCount = 1;

            // Filtros
            if (filters.name) {
                query += ` AND t.name ILIKE $${paramCount++}`;
                values.push(`%${filters.name}%`);
            }

            if (filters.type_id) {
                query += ` AND t.type_id = $${paramCount++}`;
                values.push(filters.type_id);
            }

            if (filters.status) {
                query += ` AND t.status = $${paramCount++}`;
                values.push(filters.status);
            }

            if (filters.priority) {
                query += ` AND t.priority = $${paramCount++}`;
                values.push(filters.priority);
            }

            if (filters.start_date) {
                query += ` AND t.scheduled_for >= $${paramCount++}`;
                values.push(filters.start_date);
            }

            if (filters.end_date) {
                query += ` AND t.scheduled_for <= $${paramCount++}`;
                values.push(filters.end_date);
            }

            if (filters.has_dependencies !== undefined) {
                if (filters.has_dependencies) {
                    query += ` AND EXISTS (SELECT 1 FROM task_dependencies WHERE task_id = t.task_id)`;
                } else {
                    query += ` AND NOT EXISTS (SELECT 1 FROM task_dependencies WHERE task_id = t.task_id)`;
                }
            }

            query += ` GROUP BY t.task_id, tt.name, tt.description`;
            query += ` ORDER BY t.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
            values.push(limit, offset);

            const result = await client.query(query, values);
            
            return {
                data: result.rows.map(row => ({
                    ...row,
                    dependencies: row.dependencies.filter(d => d !== null)
                })),
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
            logger.info('Buscando tasks pendentes', { limit });
            
            const query = `
                SELECT t.*, tt.name as type_name
                FROM tasks t
                JOIN task_types tt ON t.type_id = tt.type_id
                WHERE t.status = 'pending'
                AND (t.scheduled_for IS NULL OR t.scheduled_for <= NOW())
                AND NOT EXISTS (
                    SELECT 1
                    FROM task_dependencies td
                    JOIN tasks dt ON td.dependency_id = dt.task_id
                    WHERE td.task_id = t.task_id
                    AND dt.status NOT IN ('completed')
                )
                ORDER BY t.priority DESC, t.created_at ASC
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

    async findById(id) {
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT t.*,
                       tt.name as type_name,
                       array_agg(DISTINCT td.dependency_id) as dependencies,
                       json_agg(json_build_object(
                           'log_id', tl.log_id,
                           'status', tl.status,
                           'execution_time', tl.execution_time,
                           'error_message', tl.error_message,
                           'created_at', tl.created_at
                       )) as logs
                FROM tasks t
                JOIN task_types tt ON t.type_id = tt.type_id
                LEFT JOIN task_dependencies td ON t.task_id = td.task_id
                LEFT JOIN task_logs tl ON t.task_id = tl.task_id
                WHERE t.task_id = $1
                GROUP BY t.task_id, tt.name
            `;
            const result = await client.query(query, [id]);
            
            if (result.rows.length === 0) {
                return null;
            }

            const task = result.rows[0];
            return {
                ...task,
                dependencies: task.dependencies.filter(d => d !== null),
                logs: task.logs[0] === null ? [] : task.logs
            };
        } catch (error) {
            logger.error('Erro ao buscar task por ID', {
                error: error.message,
                id
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async create(data) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Insere a task
            const taskQuery = `
                INSERT INTO tasks (
                    name, type_id, description, payload, status,
                    priority, scheduled_for, max_retries
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;
            const taskResult = await client.query(taskQuery, [
                data.name,
                data.type_id,
                data.description,
                data.payload,
                data.status || 'pending',
                data.priority || 0,
                data.scheduled_for,
                data.max_retries || 3
            ]);

            // Se tiver dependências, insere elas
            if (data.dependencies && data.dependencies.length > 0) {
                const dependencyQuery = `
                    INSERT INTO task_dependencies (task_id, dependency_id)
                    VALUES ($1, unnest($2::int[]))
                `;
                await client.query(dependencyQuery, [
                    taskResult.rows[0].task_id,
                    data.dependencies
                ]);
            }

            await client.query('COMMIT');
            return taskResult.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erro ao criar task', {
                error: error.message,
                data
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async update(id, data) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Atualiza a task
            const updateFields = [];
            const values = [id];
            let paramCount = 2;

            if (data.name !== undefined) {
                updateFields.push(`name = $${paramCount++}`);
                values.push(data.name);
            }
            if (data.type_id !== undefined) {
                updateFields.push(`type_id = $${paramCount++}`);
                values.push(data.type_id);
            }
            if (data.description !== undefined) {
                updateFields.push(`description = $${paramCount++}`);
                values.push(data.description);
            }
            if (data.payload !== undefined) {
                updateFields.push(`payload = $${paramCount++}`);
                values.push(data.payload);
            }
            if (data.status !== undefined) {
                updateFields.push(`status = $${paramCount++}`);
                values.push(data.status);
            }
            if (data.priority !== undefined) {
                updateFields.push(`priority = $${paramCount++}`);
                values.push(data.priority);
            }
            if (data.scheduled_for !== undefined) {
                updateFields.push(`scheduled_for = $${paramCount++}`);
                values.push(data.scheduled_for);
            }
            if (data.max_retries !== undefined) {
                updateFields.push(`max_retries = $${paramCount++}`);
                values.push(data.max_retries);
            }

            if (updateFields.length > 0) {
                const taskQuery = `
                    UPDATE tasks
                    SET ${updateFields.join(', ')},
                        updated_at = NOW()
                    WHERE task_id = $1
                    RETURNING *
                `;
                const taskResult = await client.query(taskQuery, values);

                if (taskResult.rows.length === 0) {
                    throw new Error('Task não encontrada');
                }
            }

            await client.query('COMMIT');
            return await this.findById(id);
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erro ao atualizar task', {
                error: error.message,
                id,
                data
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async delete(id) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Remove dependências
            await client.query('DELETE FROM task_dependencies WHERE task_id = $1 OR dependency_id = $1', [id]);

            // Remove logs
            await client.query('DELETE FROM task_logs WHERE task_id = $1', [id]);

            // Remove a task
            const result = await client.query('DELETE FROM tasks WHERE task_id = $1 RETURNING *', [id]);

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erro ao deletar task', {
                error: error.message,
                id
            });
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = TaskRepository;
