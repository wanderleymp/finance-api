const { systemDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');

class MovementTypeRepository {
    constructor() {
        this.pool = systemDatabase.pool;
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            const { limit: validLimit, offset } = PaginationHelper.getPaginationParams(page, limit);
            
            let query = `
                SELECT * 
                FROM movement_types 
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

            if (filters.type_name) {
                query += ` AND type_name ILIKE $${paramCount}`;
                params.push(`%${filters.type_name}%`);
                paramCount++;
            }

            const countQuery = query.replace('*', 'COUNT(*)');
            query += ` ORDER BY movement_type_id DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(validLimit, offset);

            logger.info('Executando consulta findAll paginada em movement_types', { 
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
            logger.error('Erro ao buscar tipos de movimentação', { 
                errorMessage: error.message,
                errorStack: error.stack,
                errorCode: error.code,
                errorName: error.name,
                query: 'findAll'
            });
            throw error;
        }
    }

    async findById(movementTypeId) {
        try {
            const query = 'SELECT * FROM movement_types WHERE movement_type_id = $1';
            const { rows } = await this.pool.query(query, [movementTypeId]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao buscar tipo de movimentação por ID', { 
                errorMessage: error.message,
                errorStack: error.stack,
                movementTypeId
            });
            throw error;
        }
    }

    async create(movementTypeData) {
        const { type_name } = movementTypeData;

        try {
            const query = `
                INSERT INTO movement_types 
                (type_name) 
                VALUES ($1) 
                RETURNING *
            `;
            const { rows } = await this.pool.query(query, [type_name]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao criar tipo de movimentação', {
                error: error.message,
                movementTypeData
            });
            throw error;
        }
    }

    async update(movementTypeId, movementTypeData) {
        const { type_name } = movementTypeData;

        try {
            const query = `
                UPDATE movement_types 
                SET type_name = $1
                WHERE movement_type_id = $2
                RETURNING *
            `;
            const { rows } = await this.pool.query(query, [
                type_name,
                movementTypeId
            ]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar tipo de movimentação', {
                error: error.message,
                movementTypeId,
                movementTypeData
            });
            throw error;
        }
    }

    async delete(movementTypeId) {
        try {
            const query = 'DELETE FROM movement_types WHERE movement_type_id = $1 RETURNING *';
            const result = await this.pool.query(query, [movementTypeId]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao excluir tipo de movimentação', {
                error: error.message,
                movementTypeId
            });
            throw error;
        }
    }
}

module.exports = new MovementTypeRepository();
