const { systemDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');

class MovementStatusRepository {
    constructor() {
        this.pool = systemDatabase.pool;
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            const { limit: validLimit, offset } = PaginationHelper.getPaginationParams(page, limit);
            
            let query = `
                SELECT * 
                FROM movement_statuses 
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

            if (filters.status_name) {
                query += ` AND status_name ILIKE $${paramCount}`;
                params.push(`%${filters.status_name}%`);
                paramCount++;
            }

            const countQuery = query.replace('*', 'COUNT(*)');
            query += ` ORDER BY display_order, movement_status_id DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(validLimit, offset);

            logger.info('Executando consulta findAll paginada em movement_statuses', { 
                query,
                params,
                page,
                limit: validLimit,
                offset
            });

            const [dataResult, countResult] = await Promise.all([
                this.pool.query(query, params),
                this.pool.query(countQuery, params.slice(0, -2))
            ]);

            return {
                data: dataResult.rows,
                total: parseInt(countResult.rows[0].count)
            };
        } catch (error) {
            logger.error('Erro ao buscar status de movimentação', { 
                errorMessage: error.message,
                errorStack: error.stack,
                errorCode: error.code,
                errorName: error.name,
                query: 'findAll'
            });
            throw error;
        }
    }

    async findById(movementStatusId) {
        try {
            const query = 'SELECT * FROM movement_statuses WHERE movement_status_id = $1';
            const { rows } = await this.pool.query(query, [movementStatusId]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao buscar status de movimentação por ID', { 
                errorMessage: error.message,
                errorStack: error.stack,
                movementStatusId
            });
            throw error;
        }
    }

    async create(movementStatusData) {
        const { status_name, description, display_order } = movementStatusData;

        try {
            const query = `
                INSERT INTO movement_statuses 
                (status_name, description, display_order) 
                VALUES ($1, $2, $3) 
                RETURNING *
            `;
            const { rows } = await this.pool.query(query, [
                status_name,
                description,
                display_order
            ]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao criar status de movimentação', {
                error: error.message,
                movementStatusData
            });
            throw error;
        }
    }

    async update(movementStatusId, movementStatusData) {
        const { status_name, description, display_order } = movementStatusData;

        try {
            const query = `
                UPDATE movement_statuses 
                SET 
                    status_name = COALESCE($1, status_name),
                    description = COALESCE($2, description),
                    display_order = COALESCE($3, display_order)
                WHERE movement_status_id = $4
                RETURNING *
            `;
            const { rows } = await this.pool.query(query, [
                status_name,
                description,
                display_order,
                movementStatusId
            ]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar status de movimentação', {
                error: error.message,
                movementStatusId,
                movementStatusData
            });
            throw error;
        }
    }

    async delete(movementStatusId) {
        try {
            const query = 'DELETE FROM movement_statuses WHERE movement_status_id = $1 RETURNING *';
            const result = await this.pool.query(query, [movementStatusId]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao excluir status de movimentação', {
                error: error.message,
                movementStatusId
            });
            throw error;
        }
    }
}

module.exports = new MovementStatusRepository();
