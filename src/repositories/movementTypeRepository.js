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

            if (filters.name) {
                query += ` AND name ILIKE $${paramCount}`;
                params.push(`%${filters.name}%`);
                paramCount++;
            }

            if (filters.category) {
                query += ` AND category = $${paramCount}`;
                params.push(filters.category);
                paramCount++;
            }

            if (filters.active !== undefined) {
                query += ` AND active = $${paramCount}`;
                params.push(filters.active);
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
        const { name, description, category, active = true } = movementTypeData;

        try {
            const query = `
                INSERT INTO movement_types 
                (name, description, category, active) 
                VALUES ($1, $2, $3, $4) 
                RETURNING *
            `;
            const { rows } = await this.pool.query(query, [
                name,
                description,
                category,
                active
            ]);
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
        const { name, description, category, active } = movementTypeData;

        try {
            const query = `
                UPDATE movement_types 
                SET 
                    name = COALESCE($1, name),
                    description = COALESCE($2, description),
                    category = COALESCE($3, category),
                    active = COALESCE($4, active),
                    updated_at = NOW()
                WHERE movement_type_id = $5
                RETURNING *
            `;
            const { rows } = await this.pool.query(query, [
                name,
                description,
                category,
                active,
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
