const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');
const { DatabaseError } = require('../../utils/errors');

class MovementRepository extends BaseRepository {
    constructor() {
        super('movements', 'movement_id');
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            logger.info('Repository: Buscando movimentos', { page, limit, filters });

            // Adiciona joins personalizados aos filtros
            const customFilters = { ...filters };

            // Query personalizada com joins e alias definido
            const whereClause = this.getWhereClause(customFilters);
            const paramCount = Object.keys(customFilters).length;
            const customQuery = `
                SELECT 
                    m.movement_id,
                    m.movement_type_id,
                    m.movement_status_id,
                    m.person_id,
                    m.movement_date,
                    m.description,
                    m.created_at,
                    ms.status_name,
                    mt.type_name,
                    p.full_name as person_name
                FROM movements m
                LEFT JOIN movement_statuses ms ON m.movement_status_id = ms.movement_status_id
                LEFT JOIN movement_types mt ON m.movement_type_id = mt.movement_type_id
                LEFT JOIN persons p ON m.person_id = p.person_id
                ${whereClause}
                ORDER BY m.movement_id DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;

            // Query de contagem com os mesmos joins
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM movements m
                LEFT JOIN movement_statuses ms ON m.movement_status_id = ms.movement_status_id
                LEFT JOIN movement_types mt ON m.movement_type_id = mt.movement_type_id
                LEFT JOIN persons p ON m.person_id = p.person_id
                ${whereClause}
            `;

            // Usa o método findAll do BaseRepository com query personalizada
            const result = await super.findAll(page, limit, customFilters, {
                customQuery,
                countQuery
            });

            return {
                items: result.data,
                meta: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: Math.ceil(result.total / result.limit)
                }
            };
        } catch (error) {
            logger.error('Repository: Erro ao buscar movimentos', {
                error: error.message,
                error_stack: error.stack,
                page,
                limit,
                filters
            });
            throw new DatabaseError('Erro ao buscar movimentos');
        }
    }

    async findById(id) {
        try {
            logger.info('Repository: Buscando movimento por ID', { id });

            const query = `
                SELECT 
                    m.movement_id,
                    m.movement_type_id,
                    m.movement_status_id,
                    m.person_id,
                    m.movement_date,
                    m.description,
                    m.created_at
                FROM movements m
                WHERE m.movement_id = $1
            `;

            logger.info('Repository: Executando query', { 
                query, 
                id, 
                queryParams: [id] 
            });

            const { rows, rowCount } = await this.pool.query(query, [id]);

            logger.info('Repository: Resultado da busca', { 
                rowCount, 
                hasRows: rows.length > 0 
            });

            const movement = rows[0];

            logger.info('Repository: Movimento encontrado', { 
                movement: movement ? {
                    movement_id: movement.movement_id,
                    movement_type_id: movement.movement_type_id,
                    person_id: movement.person_id
                } : null 
            });

            return movement;
        } catch (error) {
            logger.error('Repository: Erro ao buscar registro por ID', {
                error: error.message,
                error_stack: error.stack,
                tableName: this.tableName,
                id
            });
            throw error;
        }
    }

    /**
     * Cria um movimento com cliente de transação
     * @param {Object} client - Cliente de transação
     * @param {Object} data - Dados do movimento
     * @returns {Promise<Object>} Movimento criado
     */
    async createWithClient(client, data) {
        try {
            logger.info('Repository: Criando movimento com cliente de transação', { data });

            const columns = Object.keys(data);
            const values = Object.values(data);
            const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

            const query = `
                INSERT INTO ${this.tableName} (${columns.join(', ')})
                VALUES (${placeholders})
                RETURNING *
            `;

            const result = await client.query(query, values);
            
            logger.info('Repository: Movimento criado com sucesso', { 
                movement_id: result.rows[0].movement_id 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Repository: Erro ao criar movimento', {
                error: error.message,
                data,
                tableName: this.tableName
            });
            throw new DatabaseError('Erro ao criar movimento', error);
        }
    }

    /**
     * Atualiza movimento com cliente de transação
     * @param {Object} client - Cliente de transação
     * @param {number} id - ID do movimento
     * @param {Object} data - Dados para atualização
     * @returns {Promise<Object>} Movimento atualizado
     */
    async updateWithClient(client, id, data) {
        try {
            logger.info('Repository: Atualizando movimento com cliente de transação', { 
                id, 
                data 
            });

            const setColumns = Object.keys(data)
                .map((key, index) => `${key} = $${index + 2}`)
                .join(', ');

            const query = `
                UPDATE ${this.tableName}
                SET ${setColumns}
                WHERE ${this.primaryKey} = $1
                RETURNING *
            `;

            const values = [id, ...Object.values(data)];

            const result = await client.query(query, values);
            
            if (result.rows.length === 0) {
                throw new DatabaseError(`Movimento com ID ${id} não encontrado`);
            }

            logger.info('Repository: Movimento atualizado com sucesso', { 
                movement_id: result.rows[0].movement_id 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Repository: Erro ao atualizar movimento', {
                error: error.message,
                id,
                data,
                tableName: this.tableName
            });
            throw new DatabaseError('Erro ao atualizar movimento', error);
        }
    }

    /**
     * Remove movimento com cliente de transação
     * @param {Object} client - Cliente de transação
     * @param {number} id - ID do movimento
     * @returns {Promise<Object>} Movimento removido
     */
    async deleteWithClient(client, id) {
        try {
            logger.info('Repository: Removendo movimento com cliente de transação', { id });

            const query = `
                DELETE FROM ${this.tableName}
                WHERE ${this.primaryKey} = $1
                RETURNING *
            `;

            const result = await client.query(query, [id]);
            
            if (result.rows.length === 0) {
                throw new DatabaseError(`Movimento com ID ${id} não encontrado`);
            }

            logger.info('Repository: Movimento removido com sucesso', { 
                movement_id: result.rows[0].movement_id 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Repository: Erro ao remover movimento', {
                error: error.message,
                id,
                tableName: this.tableName
            });
            throw new DatabaseError('Erro ao remover movimento', error);
        }
    }

    getWhereClause(filters) {
        const conditions = Object.keys(filters)
            .map((key, index) => `${key} = $${index + 1}`)
            .join(' AND ');

        return conditions ? `WHERE ${conditions}` : '';
    }
}

module.exports = MovementRepository;
