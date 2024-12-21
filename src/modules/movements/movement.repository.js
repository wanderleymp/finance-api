const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');

class MovementRepository extends BaseRepository {
    constructor() {
        super('movements', 'movement_id');
    }

    /**
     * Lista todos os movimentos com filtros
     */
    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const offset = (page - 1) * limit;
            
            // Prepara os filtros
            const queryParams = [];
            const conditions = [];
            let paramCount = 1;

            // Filtros básicos (exceto datas)
            for (const [key, value] of Object.entries(filters)) {
                if (value !== undefined && value !== null && !key.includes('movement_date')) {
                    conditions.push(`${key} = $${paramCount}`);
                    queryParams.push(value);
                    paramCount++;
                }
            }

            // Filtros de data
            if (filters.movement_date_start) {
                conditions.push(`movement_date >= $${paramCount}`);
                queryParams.push(filters.movement_date_start);
                paramCount++;
            }
            if (filters.movement_date_end) {
                conditions.push(`movement_date <= $${paramCount}`);
                queryParams.push(filters.movement_date_end);
                paramCount++;
            }

            const whereClause = conditions.length > 0 
                ? `WHERE ${conditions.join(' AND ')}` 
                : '';

            // Query para buscar os dados
            const query = `
                SELECT *
                FROM ${this.tableName}
                ${whereClause}
                ORDER BY created_at DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            // Query para contar o total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM ${this.tableName}
                ${whereClause}
            `;

            logger.debug('Repository: Executando query', {
                query,
                countQuery,
                queryParams,
                paramCount
            });

            const [data, countResult] = await Promise.all([
                this.pool.query(query, [...queryParams, limit, offset]),
                this.pool.query(countQuery, queryParams)
            ]);

            const totalItems = parseInt(countResult.rows[0].total);
            const totalPages = Math.ceil(totalItems / limit);

            return {
                data: data.rows,
                pagination: {
                    page,
                    limit,
                    totalItems,
                    totalPages
                }
            };
        } catch (error) {
            logger.error('Erro ao listar registros', {
                error: error.message,
                tableName: this.tableName,
                filters
            });
            throw error;
        }
    }

    /**
     * Lista todos os movimentos com detalhes
     */
    async findAllDetailed(page = 1, limit = 10, filters = {}) {
        try {
            const offset = (page - 1) * limit;
            
            // Prepara os filtros
            const queryParams = [];
            const conditions = [];
            let paramCount = 1;

            // Filtros básicos (exceto datas)
            for (const [key, value] of Object.entries(filters)) {
                if (value !== undefined && value !== null && !key.includes('movement_date')) {
                    conditions.push(`${key} = $${paramCount}`);
                    queryParams.push(value);
                    paramCount++;
                }
            }

            // Filtros de data
            if (filters.movement_date_start) {
                conditions.push(`movement_date >= $${paramCount}`);
                queryParams.push(filters.movement_date_start);
                paramCount++;
            }
            if (filters.movement_date_end) {
                conditions.push(`movement_date <= $${paramCount}`);
                queryParams.push(filters.movement_date_end);
                paramCount++;
            }

            const whereClause = conditions.length > 0 
                ? `WHERE ${conditions.join(' AND ')}` 
                : '';

            // Query para buscar os dados
            const query = `
                SELECT *
                FROM ${this.tableName}
                ${whereClause}
                ORDER BY created_at DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            // Query para contar o total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM ${this.tableName}
                ${whereClause}
            `;

            logger.debug('Repository: Executando query', {
                query,
                countQuery,
                queryParams,
                paramCount
            });

            const [data, countResult] = await Promise.all([
                this.pool.query(query, [...queryParams, limit, offset]),
                this.pool.query(countQuery, queryParams)
            ]);

            const totalItems = parseInt(countResult.rows[0].total);
            const totalPages = Math.ceil(totalItems / limit);

            return {
                data: data.rows,
                pagination: {
                    page,
                    limit,
                    totalItems,
                    totalPages
                }
            };
        } catch (error) {
            logger.error('Erro ao listar registros', {
                error: error.message,
                tableName: this.tableName,
                filters
            });
            throw error;
        }
    }

    /**
     * Atualiza o status de um movimento
     */
    async updateStatus(id, status) {
        try {
            const query = `
                UPDATE ${this.tableName}
                SET movement_status_id = $1
                WHERE movement_id = $2
                RETURNING *
            `;

            const result = await this.pool.query(query, [status, id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar status', {
                error: error.message,
                tableName: this.tableName,
                id,
                status
            });
            throw error;
        }
    }
}

module.exports = MovementRepository;
