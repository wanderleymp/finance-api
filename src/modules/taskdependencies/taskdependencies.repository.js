const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');

class TaskDependenciesRepository extends BaseRepository {
    constructor() {
        super('task_dependencies', 'dependency_id');
    }

    async findByTaskId(taskId) {
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT td.*, t.name as dependent_task_name, t.type_id as dependent_task_type_id, t.status as dependent_task_status
                FROM task_dependencies td
                LEFT JOIN tasks t ON t.task_id = td.depends_on_task_id
                WHERE td.task_id = $1 AND td.active = true
                ORDER BY td.created_at
            `;
            const result = await client.query(query, [taskId]);
            return result.rows.map(row => ({
                ...row,
                dependent_task: {
                    task_id: row.depends_on_task_id,
                    name: row.dependent_task_name,
                    type_id: row.dependent_task_type_id,
                    status: row.dependent_task_status
                }
            }));
        } catch (error) {
            logger.error('Erro ao buscar dependências da task', {
                error: error.message,
                taskId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async findDependentTasks(taskId) {
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT td.*, t.name as main_task_name, t.type_id as main_task_type_id, t.status as main_task_status
                FROM task_dependencies td
                LEFT JOIN tasks t ON t.task_id = td.task_id
                WHERE td.depends_on_task_id = $1 AND td.active = true
                ORDER BY td.created_at
            `;
            const result = await client.query(query, [taskId]);
            return result.rows.map(row => ({
                ...row,
                main_task: {
                    task_id: row.task_id,
                    name: row.main_task_name,
                    type_id: row.main_task_type_id,
                    status: row.main_task_status
                }
            }));
        } catch (error) {
            logger.error('Erro ao buscar tasks dependentes', {
                error: error.message,
                taskId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async checkCircularDependency(taskId, dependsOnTaskId) {
        const client = await this.pool.connect();
        try {
            // Verifica se a task dependente não depende da task principal
            const query = `
                WITH RECURSIVE dependency_chain AS (
                    -- Base case: dependências diretas
                    SELECT task_id, depends_on_task_id, 1 as level
                    FROM task_dependencies
                    WHERE task_id = $2 AND active = true
                    
                    UNION
                    
                    -- Recursive case: dependências indiretas
                    SELECT td.task_id, td.depends_on_task_id, dc.level + 1
                    FROM task_dependencies td
                    INNER JOIN dependency_chain dc ON td.task_id = dc.depends_on_task_id
                    WHERE td.active = true
                )
                SELECT EXISTS (
                    SELECT 1 FROM dependency_chain WHERE depends_on_task_id = $1
                ) as has_circular;
            `;
            const result = await client.query(query, [taskId, dependsOnTaskId]);
            return result.rows[0].has_circular;
        } catch (error) {
            logger.error('Erro ao verificar dependência circular', {
                error: error.message,
                taskId,
                dependsOnTaskId
            });
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = TaskDependenciesRepository;
