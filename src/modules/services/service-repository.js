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
     * Busca serviços com filtros seguindo padrão RESTful
     * @param {Object} filters - Filtros para busca
     * @param {number} page - Página atual
     * @param {number} limit - Limite de serviços por página
     * @returns {Promise<Object>} Resultado da busca no padrão RESTful
     */
    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            // Calcular offset
            const offset = (page - 1) * limit;

            // Query base
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
                    (SELECT name FROM service_groups WHERE service_group_id = s.service_group_id) AS service_group_name
                FROM services s
                JOIN items i ON s.item_id = i.item_id
                WHERE i.deleted_at IS NULL
                ORDER BY i.created_at DESC
                LIMIT $1 OFFSET $2
            `;

            const countQuery = `
                SELECT COUNT(*) as total
                FROM services s
                JOIN items i ON s.item_id = i.item_id
                WHERE i.deleted_at IS NULL
            `;

            // Executar queries
            const [dataResult, countResult] = await Promise.all([
                this.pool.query(query, [limit, offset]),
                this.pool.query(countQuery)
            ]);

            // Calcular total de páginas
            const totalItems = parseInt(countResult.rows[0].total);
            const totalPages = Math.ceil(totalItems / limit);

            // Construir links de paginação
            const baseUrl = '/services';
            const links = {
                first: `${baseUrl}?page=1&limit=${limit}`,
                previous: page > 1 ? `${baseUrl}?page=${page - 1}&limit=${limit}` : null,
                next: page < totalPages ? `${baseUrl}?page=${page + 1}&limit=${limit}` : null,
                last: `${baseUrl}?page=${totalPages}&limit=${limit}`
            };

            // Retorno garantido
            return {
                items: dataResult.rows || [],
                meta: {
                    totalItems,
                    itemCount: dataResult.rows.length,
                    itemsPerPage: limit,
                    totalPages,
                    currentPage: page
                },
                links
            };
        } catch (error) {
            logger.error('Erro ao buscar serviços', { 
                error: error.message, 
                stack: error.stack,
                page,
                limit
            });
            return {
                items: [],
                meta: {
                    totalItems: 0,
                    itemCount: 0,
                    itemsPerPage: limit,
                    totalPages: 1,
                    currentPage: page
                },
                links: {
                    first: `/services?page=1&limit=${limit}`,
                    previous: null,
                    next: null,
                    last: `/services?page=1&limit=${limit}`
                }
            };
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
     * @param {number[]} itemIds - Lista de IDs de itens de serviço
     * @returns {Promise<Object[]>} Lista de detalhes de serviços
     */
    async findMultipleServiceDetails(itemIds) {
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
