const { logger } = require('../../middlewares/logger');
const BaseRepository = require('../../repositories/base/BaseRepository');
const { DatabaseError } = require('../../utils/errors');

class ServiceRepository extends BaseRepository {
    constructor() {
        super('services', 'service_id');
    }

    /**
     * Cria um serviço
     * @param {Object} data - Dados do serviço
     * @returns {Promise<Object>} Serviço criado
     */
    async create(data) {
        try {
            const fields = Object.keys(data);
            const values = Object.values(data);
            const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
            
            const query = `
                INSERT INTO ${this.tableName} (${fields.join(', ')}, created_at, updated_at)
                VALUES (${placeholders}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING service_id, item_id, service_group_id, description AS service_description, active, created_at, updated_at
            `;
            
            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar serviço', { error, data });
            throw new DatabaseError('Erro ao criar serviço', error);
        }
    }

    /**
     * Atualiza serviço
     * @param {number} id - ID do serviço
     * @param {Object} data - Dados para atualização
     * @returns {Promise<Object>} Serviço atualizado
     */
    async update(id, data) {
        try {
            const fields = Object.keys(data);
            const values = Object.values(data);
            const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
            
            const query = `
                UPDATE ${this.tableName}
                SET ${setClause}, updated_at = CURRENT_TIMESTAMP
                WHERE service_id = $${fields.length + 1} AND deleted_at IS NULL
                RETURNING service_id, item_id, service_group_id, description AS service_description, active, created_at, updated_at
            `;
            
            const result = await this.pool.query(query, [...values, id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar serviço', { error, id, data });
            throw new DatabaseError('Erro ao atualizar serviço', error);
        }
    }

    /**
     * Remove serviço (soft delete)
     * @param {number} id - ID do serviço
     * @returns {Promise<boolean>} True se removido com sucesso
     */
    async delete(id) {
        try {
            const query = `
                UPDATE ${this.tableName}
                SET deleted_at = CURRENT_TIMESTAMP
                WHERE service_id = $1 AND deleted_at IS NULL
            `;
            await this.pool.query(query, [id]);
            return true;
        } catch (error) {
            logger.error('Erro ao remover serviço', { error, id });
            throw new DatabaseError('Erro ao remover serviço', error);
        }
    }

    /**
     * Busca serviços com filtros
     * @param {Object} filters - Filtros para busca
     * @param {number} page - Página atual
     * @param {number} limit - Limite de serviços por página
     * @returns {Promise<Object>} Resultado da busca
     */
    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            let query = `
                SELECT 
                    s.service_id, 
                    s.item_id, 
                    s.service_group_id, 
                    i.description,
                    i.name,
                    i.active, 
                    i.created_at, 
                    i.updated_at,
                    i.name AS item_name,
                    i.description AS item_description,
                    (SELECT name FROM service_groups WHERE service_group_id = s.service_group_id) AS service_group_name,
                    COUNT(*) OVER() as total_count
                FROM services s
                JOIN items i ON s.item_id = i.item_id
                WHERE i.deleted_at IS NULL
            `;
            const values = [];
            let paramCount = 1;

            if (filters.item_id) {
                query += ` AND s.item_id = $${paramCount++}`;
                values.push(filters.item_id);
            }

            if (filters.service_group_id) {
                query += ` AND s.service_group_id = $${paramCount++}`;
                values.push(filters.service_group_id);
            }

            if (filters.description) {
                query += ` AND i.description ILIKE $${paramCount++}`;
                values.push(`%${filters.description}%`);
            }

            if (filters.active !== undefined) {
                query += ` AND i.active = $${paramCount++}`;
                values.push(filters.active);
            }

            query += ` ORDER BY i.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
            values.push(limit, offset);

            const result = await this.pool.query(query, values);

            return {
                data: result.rows,
                total: result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0,
                page,
                limit
            };
        } catch (error) {
            logger.error('Erro ao buscar serviços', { 
                error: error.message, 
                filters,
                page,
                limit,
                query: query,
                values: values
            });
            throw new DatabaseError('Erro ao buscar serviços', error);
        }
    }

    /**
     * Busca detalhes de serviço
     * @param {number} itemId - ID do item de serviço
     * @returns {Promise<Object>} Detalhes do serviço
     */
    async findServiceDetails(itemId) {
        try {
            const query = `
                SELECT 
                    s.service_id,
                    s.item_id,
                    s.service_group_id,
                    i.description,
                    i.name,
                    i.active,
                    i.created_at,
                    i.updated_at,
                    i.name AS item_name,
                    i.description AS item_description,
                    sm.ctribmun AS municipality_code,
                    sl.code AS lc116_code,
                    sl.description AS lc116_description,
                    sl.cnae
                FROM services s
                JOIN items i ON s.item_id = i.item_id
                LEFT JOIN service_groups sg ON s.service_group_id = sg.service_group_id
                LEFT JOIN service_municipality sm ON sg.service_municipality_id = sm.service_municipality_id
                LEFT JOIN service_lc116 sl ON sm.service_lc116_id = sl.service_lc116_id
                WHERE s.item_id = $1 AND i.deleted_at IS NULL
            `;

            const result = await this.pool.query(query, [itemId]);
            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao buscar detalhes do serviço', { 
                error: error.message, 
                itemId 
            });
            throw new DatabaseError('Erro ao buscar detalhes do serviço', error);
        }
    }

    /**
     * Busca detalhes de múltiplos serviços
     * @param {number[]} itemIds - Array de IDs de itens de serviço
     * @returns {Promise<Object[]>} Lista de detalhes de serviços
     */
    async findMultipleServiceDetails(itemIds) {
        try {
            if (!itemIds || itemIds.length === 0) {
                return [];
            }

            const query = `
                SELECT 
                    s.service_id,
                    s.item_id,
                    s.service_group_id,
                    i.description,
                    i.name,
                    i.active,
                    i.created_at,
                    i.updated_at,
                    i.name AS item_name,
                    i.description AS item_description,
                    sm.ctribmun AS municipality_code,
                    sl.code AS lc116_code,
                    sl.description AS lc116_description,
                    sl.cnae
                FROM services s
                JOIN items i ON s.item_id = i.item_id
                LEFT JOIN service_groups sg ON s.service_group_id = sg.service_group_id
                LEFT JOIN service_municipality sm ON sg.service_municipality_id = sm.service_municipality_id
                LEFT JOIN service_lc116 sl ON sm.service_lc116_id = sl.service_lc116_id
                WHERE s.item_id = ANY($1) AND i.deleted_at IS NULL
            `;

            const result = await this.pool.query(query, [itemIds]);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar detalhes de múltiplos serviços', { 
                error: error.message, 
                itemIds 
            });
            throw new DatabaseError('Erro ao buscar detalhes de múltiplos serviços', error);
        }
    }
}

module.exports = ServiceRepository;
