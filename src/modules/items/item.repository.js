const { logger } = require('../../middlewares/logger');
const BaseRepository = require('../../repositories/base/BaseRepository');

class ItemRepository extends BaseRepository {
    constructor() {
        super('items', 'item_id');
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            // Prepara os filtros
            const queryParams = [];
            const conditions = ['deleted_at IS NULL'];
            let paramCount = 1;

            // Filtros dinâmicos
            if (filters.code) {
                conditions.push(`code ILIKE $${paramCount}`);
                queryParams.push(`%${filters.code}%`);
                paramCount++;
            }

            if (filters.name) {
                conditions.push(`name ILIKE $${paramCount}`);
                queryParams.push(`%${filters.name}%`);
                paramCount++;
            }

            if (filters.price) {
                if (filters.price.$gte !== undefined) {
                    conditions.push(`price >= $${paramCount}`);
                    queryParams.push(filters.price.$gte);
                    paramCount++;
                }
                if (filters.price.$lte !== undefined) {
                    conditions.push(`price <= $${paramCount}`);
                    queryParams.push(filters.price.$lte);
                    paramCount++;
                }
            }

            if (filters.active !== undefined) {
                conditions.push(`active = $${paramCount}`);
                queryParams.push(filters.active);
                paramCount++;
            }

            // Garante que page e limit são números
            const parsedPage = parseInt(page) || 1;
            const parsedLimit = parseInt(limit) || 10;
            const offset = (parsedPage - 1) * parsedLimit;

            // Query para buscar os dados
            const query = `
                SELECT item_id, code, name, description, price, active, created_at, updated_at
                FROM ${this.tableName}
                WHERE ${conditions.join(' AND ')}
                ORDER BY item_id DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            // Query para contar o total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM ${this.tableName}
                WHERE ${conditions.join(' AND ')}
            `;

            // Executa as queries
            const [data, countResult] = await Promise.all([
                this.pool.query(query, [...queryParams, parsedLimit, offset]),
                this.pool.query(countQuery, queryParams)
            ]);

            const total = parseInt(countResult.rows[0].total);
            const totalPages = Math.ceil(total / parsedLimit);

            return {
                data: data.rows,
                pagination: {
                    total,
                    totalPages,
                    page: parsedPage,
                    limit: parsedLimit
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar items', { error });
            throw error;
        }
    }

    async findById(id) {
        try {
            const query = `
                SELECT item_id, code, name, description, price, active, created_at, updated_at
                FROM ${this.tableName}
                WHERE item_id = $1 AND deleted_at IS NULL
            `;
            const result = await this.pool.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao buscar item por ID', { error, id });
            throw error;
        }
    }

    async create(data) {
        try {
            const fields = Object.keys(data);
            const values = Object.values(data);
            const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
            
            const query = `
                INSERT INTO ${this.tableName} (${fields.join(', ')})
                VALUES (${placeholders})
                RETURNING item_id, code, name, description, price, active, created_at, updated_at
            `;
            
            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar item', { error, data });
            throw error;
        }
    }

    async update(id, data) {
        try {
            const fields = Object.keys(data);
            const values = Object.values(data);
            const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
            
            const query = `
                UPDATE ${this.tableName}
                SET ${setClause}, updated_at = CURRENT_TIMESTAMP
                WHERE item_id = $${fields.length + 1} AND deleted_at IS NULL
                RETURNING item_id, code, name, description, price, active, created_at, updated_at
            `;
            
            const result = await this.pool.query(query, [...values, id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar item', { error, id, data });
            throw error;
        }
    }

    async delete(id) {
        try {
            const query = `
                UPDATE ${this.tableName}
                SET deleted_at = CURRENT_TIMESTAMP
                WHERE item_id = $1 AND deleted_at IS NULL
            `;
            await this.pool.query(query, [id]);
            return true;
        } catch (error) {
            logger.error('Erro ao remover item', { error, id });
            throw error;
        }
    }
}

module.exports = ItemRepository;
