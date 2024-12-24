const { logger } = require('../../middlewares/logger');
const BaseRepository = require('../../repositories/base/BaseRepository');

class ItemRepository extends BaseRepository {
    constructor() {
        super('items', 'item_id');
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        const client = await this.pool.connect();
        try {
            const offset = (page - 1) * limit;

            // Constrói a query base
            let query = `
                SELECT i.*, COUNT(*) OVER() as total_count
                FROM items i
                WHERE 1=1
            `;
            const values = [];
            let paramCount = 1;

            // Adiciona filtros
            if (filters.code) {
                query += ` AND code = $${paramCount++}`;
                values.push(filters.code);
            }

            if (filters.name) {
                query += ` AND name = $${paramCount++}`;
                values.push(filters.name);
            }

            if (filters.search) {
                query += ` AND name ILIKE $${paramCount++}`;
                values.push(`%${filters.search}%`);
            }

            if (filters.price) {
                if (filters.price.$gte) {
                    query += ` AND price >= $${paramCount++}`;
                    values.push(filters.price.$gte);
                }
                if (filters.price.$lte) {
                    query += ` AND price <= $${paramCount++}`;
                    values.push(filters.price.$lte);
                }
            }

            if (filters.active !== undefined) {
                query += ` AND active = $${paramCount++}`;
                values.push(filters.active);
            }

            // Ordenação padrão por name se não especificado
            const validFields = ['code', 'name', 'price', 'created_at'];
            const orderBy = validFields.includes(filters.orderBy) ? filters.orderBy : 'name';
            const orderDirection = ['ASC', 'DESC'].includes(filters.orderDirection) ? filters.orderDirection : 'ASC';
            query += ` ORDER BY ${orderBy} ${orderDirection}`;

            // Adiciona paginação
            query += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
            values.push(limit, offset);

            const result = await client.query(query, values);

            const totalCount = result.rows[0]?.total_count || 0;
            const totalPages = Math.ceil(totalCount / limit);

            return {
                data: result.rows.map(row => {
                    delete row.total_count;
                    return row;
                }),
                pagination: {
                    total: parseInt(totalCount),
                    totalPages,
                    currentPage: page,
                    limit
                }
            };
        } catch (error) {
            logger.error('Repository: Erro ao listar items', { error });
            throw error;
        } finally {
            client.release();
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
