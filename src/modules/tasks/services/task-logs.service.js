const { systemDatabase } = require('../../../config/database');
const { logger } = require('../../../middlewares/logger');

class TaskLogsService {
    constructor() {
        this.pool = systemDatabase.pool;
        this.logger = logger;
    }

    async findLogs({ 
        taskId, 
        startDate, 
        endDate, 
        level, 
        limit = 100, 
        offset = 0 
    }) {
        const params = [];
        let query = `
            SELECT 
                id,
                task_id,
                level,
                message,
                metadata,
                created_at
            FROM task_logs
            WHERE 1=1
        `;

        if (taskId) {
            params.push(taskId);
            query += ` AND task_id = $${params.length}`;
        }

        if (startDate) {
            params.push(startDate);
            query += ` AND created_at >= $${params.length}`;
        }

        if (endDate) {
            params.push(endDate);
            query += ` AND created_at <= $${params.length}`;
        }

        if (level) {
            params.push(level);
            query += ` AND level = $${params.length}`;
        }

        // Count total
        const countResult = await this.pool.query(
            `SELECT COUNT(*) as total FROM (${query}) as subquery`,
            params
        );
        const total = parseInt(countResult.rows[0].total);

        // Get paginated results
        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await this.pool.query(query, params);

        return {
            total,
            logs: result.rows,
            pagination: {
                offset,
                limit,
                hasMore: offset + limit < total
            }
        };
    }

    async findLogById(id) {
        const result = await this.pool.query(
            `SELECT 
                id,
                task_id,
                level,
                message,
                metadata,
                created_at
            FROM task_logs
            WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            throw new Error('Log não encontrado');
        }

        return result.rows[0];
    }
}

module.exports = TaskLogsService;
