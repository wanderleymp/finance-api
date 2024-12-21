const { systemDatabase } = require('../../config/database');
const { logger } = require('../../middlewares/logger');

class BaseRepository {
    constructor(tableName, primaryKey = 'id') {
        this.tableName = tableName;
        this.primaryKey = primaryKey;
        this.pool = systemDatabase.pool;
    }

    /**
     * Lista todos os registros
     */
    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const offset = (page - 1) * limit;
            
            // Prepara os filtros
            const queryParams = [];
            const conditions = [];
            let paramCount = 1;

            // Filtros básicos
            for (const [key, value] of Object.entries(filters)) {
                if (value !== undefined && value !== null) {
                    conditions.push(`${key} = $${paramCount}`);
                    queryParams.push(value);
                    paramCount++;
                }
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
     * Busca registro por ID
     */
    async findById(id) {
        try {
            const query = `
                SELECT *
                FROM ${this.tableName}
                WHERE ${this.primaryKey} = $1
            `;

            const result = await this.pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar registro por ID', {
                error: error.message,
                tableName: this.tableName,
                id
            });
            throw error;
        }
    }

    /**
     * Cria um novo registro
     */
    async create(data) {
        try {
            const columns = Object.keys(data);
            const values = Object.values(data);
            const placeholders = values.map((_, index) => `$${index + 1}`);

            const query = `
                INSERT INTO ${this.tableName} (${columns.join(', ')})
                VALUES (${placeholders.join(', ')})
                RETURNING *
            `;

            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar registro', {
                error: error.message,
                tableName: this.tableName,
                data
            });
            throw error;
        }
    }

    /**
     * Atualiza um registro
     */
    async update(id, data) {
        try {
            const updates = Object.entries(data)
                .map(([key, _], index) => `${key} = $${index + 1}`)
                .join(', ');

            const query = `
                UPDATE ${this.tableName}
                SET ${updates}
                WHERE ${this.primaryKey} = $${Object.keys(data).length + 1}
                RETURNING *
            `;

            const result = await this.pool.query(query, [...Object.values(data), id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar registro', {
                error: error.message,
                tableName: this.tableName,
                id,
                data
            });
            throw error;
        }
    }

    /**
     * Remove um registro
     */
    async delete(id) {
        try {
            const query = `
                DELETE FROM ${this.tableName}
                WHERE ${this.primaryKey} = $1
                RETURNING *
            `;

            const result = await this.pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao remover registro', {
                error: error.message,
                tableName: this.tableName,
                id
            });
            throw error;
        }
    }
}

module.exports = BaseRepository;
