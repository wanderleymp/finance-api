const { logger } = require('../../middlewares/logger');
const BaseRepository = require('../../repositories/base/BaseRepository');
const { DatabaseError } = require('../../utils/errors');

class ItemRepository extends BaseRepository {
    constructor() {
        super('items', 'item_id');
    }

    /**
     * Cria um item
     * @param {Object} data - Dados do item
     * @returns {Promise<Object>} Item criado
     */
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

    /**
     * Atualiza item
     * @param {number} id - ID do item
     * @param {Object} data - Dados para atualização
     * @returns {Promise<Object>} Item atualizado
     */
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

    /**
     * Remove item
     * @param {number} id - ID do item
     * @returns {Promise<boolean>} True se removido com sucesso
     */
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

    /**
     * Busca itens com filtros
     * @param {Object} filters - Filtros para busca
     * @param {number} page - Página atual
     * @param {number} limit - Limite de itens por página
     * @returns {Promise<Object>} Resultado da busca
     */
    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            // Constrói a query base
            let query = `
                SELECT i.*, COUNT(*) OVER() as total_count
                FROM ${this.tableName} i
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

            // Adiciona ordenação e paginação
            query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
            values.push(limit, offset);

            const result = await this.pool.query(query, values);

            return {
                data: result.rows,
                total: result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0,
                page,
                limit
            };
        } catch (error) {
            logger.error('Erro ao buscar itens', {
                error: error.message,
                filters,
                page,
                limit
            });
            throw new DatabaseError('Erro ao buscar itens', error);
        }
    }

    /**
     * Busca item por ID
     * @param {number} id - ID do item
     * @returns {Promise<Object>} Item encontrado
     */
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
}

module.exports = ItemRepository;
