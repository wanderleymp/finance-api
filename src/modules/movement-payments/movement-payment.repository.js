const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');
const { systemDatabase } = require('../../config/database');

class MovementPaymentRepository extends BaseRepository {
    constructor() {
        super('movement_payments', 'payment_id');
    }

    /**
     * Lista pagamentos com filtros
     */
    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            // Prepara os parâmetros da query
            const offset = (page - 1) * limit;
            const queryParams = [];
            let paramCount = 0;

            // Monta a cláusula WHERE
            const conditions = [];
            if (filters.movement_id) {
                paramCount++;
                queryParams.push(filters.movement_id);
                conditions.push(`mp.movement_id = $${paramCount}`);
            }
            if (filters.payment_method_id) {
                paramCount++;
                queryParams.push(filters.payment_method_id);
                conditions.push(`mp.payment_method_id = $${paramCount}`);
            }
            if (filters.status) {
                paramCount++;
                queryParams.push(filters.status);
                conditions.push(`mp.status = $${paramCount}`);
            }
            if (filters.total_amount_min) {
                paramCount++;
                queryParams.push(filters.total_amount_min);
                conditions.push(`mp.total_amount >= $${paramCount}`);
            }
            if (filters.total_amount_max) {
                paramCount++;
                queryParams.push(filters.total_amount_max);
                conditions.push(`mp.total_amount <= $${paramCount}`);
            }

            const whereClause = conditions.length > 0 
                ? `WHERE ${conditions.join(' AND ')}` 
                : '';

            // Query principal
            const query = `
                SELECT 
                    mp.*,
                    pm.method_name
                FROM movement_payments mp
                LEFT JOIN payment_methods pm ON pm.payment_method_id = mp.payment_method_id
                ${whereClause}
                ORDER BY mp.created_at DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;

            // Query de contagem
            const countQuery = `
                SELECT COUNT(*) as total
                FROM movement_payments mp
                ${whereClause}
            `;

            // Adiciona os parâmetros de paginação
            queryParams.push(limit, offset);

            // Log da query
            logger.info('Repository: Executando query', { 
                query,
                countQuery,
                queryParams,
                paramCount
            });

            // Executa as queries
            const [result, countResult] = await Promise.all([
                systemDatabase.pool.query(query, queryParams),
                systemDatabase.pool.query(countQuery, queryParams.slice(0, -2))
            ]);

            return {
                rows: result.rows,
                count: parseInt(countResult.rows[0].total)
            };
        } catch (error) {
            logger.error('Erro ao listar pagamentos', {
                error: error.message,
                page,
                limit,
                filters
            });
            throw error;
        }
    }

    /**
     * Busca pagamentos de um movimento
     */
    async findByMovementId(movementId) {
        try {
            const query = `
                SELECT 
                    mp.*,
                    pm.method_name
                FROM movement_payments mp
                LEFT JOIN payment_methods pm ON pm.payment_method_id = mp.payment_method_id
                WHERE mp.movement_id = $1
                ORDER BY mp.created_at DESC
            `;

            logger.info('Repository: Executando busca de pagamentos', { 
                movementId, 
                query 
            });

            const { rows } = await this.pool.query(query, [movementId]);

            logger.info('Repository: Resultado da busca de pagamentos', { 
                movementId,
                payment_count: rows.length,
                payment_ids: rows.map(r => r.payment_id)
            });

            return rows;
        } catch (error) {
            logger.error('Erro ao buscar pagamentos do movimento', {
                error: error.message,
                movementId,
                error_stack: error.stack
            });
            throw error;
        }
    }

    async findMovementById(movementId) {
        try {
            const query = `
                SELECT 
                    m.*
                FROM movements m
                WHERE m.movement_id = $1
            `;

            logger.info('Repository: Buscando movimento por ID', { id: movementId });

            const result = await systemDatabase.pool.query(query, [movementId]);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Repository: Erro ao buscar movimento por ID', {
                error: error.message,
                error_stack: error.stack,
                movementId
            });
            throw error;
        }
    }

    /**
     * Sobrescreve o método create do BaseRepository para adicionar created_at e updated_at
     */
    async create(data) {
        return super.create({
            ...data,
            created_at: new Date(),
            updated_at: new Date()
        });
    }

    /**
     * Atualiza um pagamento
     */
    async update(id, data) {
        try {
            const updates = [];
            const values = [];
            let paramCount = 1;

            if (data.payment_method_id !== undefined) {
                updates.push(`payment_method_id = $${paramCount}`);
                values.push(data.payment_method_id);
                paramCount++;
            }

            if (data.total_amount !== undefined) {
                updates.push(`total_amount = $${paramCount}`);
                values.push(data.total_amount);
                paramCount++;
            }

            if (data.status !== undefined) {
                updates.push(`status = $${paramCount}`);
                values.push(data.status);
                paramCount++;
            }

            if (updates.length === 0) {
                throw new Error('Nenhum campo para atualizar');
            }

            updates.push('updated_at = NOW()');
            values.push(id);

            const query = `
                UPDATE movement_payments
                SET ${updates.join(', ')}
                WHERE payment_id = $${paramCount}
                RETURNING *
            `;

            const { rows } = await systemDatabase.pool.query(query, values);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar pagamento', {
                error: error.message,
                id,
                data
            });
            throw error;
        }
    }

    /**
     * Remove um pagamento
     */
    async delete(id) {
        try {
            const query = `
                DELETE FROM movement_payments
                WHERE payment_id = $1
                RETURNING *
            `;

            const { rows } = await systemDatabase.pool.query(query, [id]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao remover pagamento', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    /**
     * Cria um pagamento com cliente de transação
     * @param {Object} client - Cliente de transação
     * @param {Object} data - Dados do pagamento
     * @returns {Promise<Object>} Pagamento criado
     */
    async createWithClient(client, data) {
        try {
            logger.info('Repository: Criando pagamento com cliente de transação', { data });

            const columns = Object.keys(data);
            const values = Object.values(data);
            const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

            const query = `
                INSERT INTO ${this.tableName} (${columns.join(', ')}, created_at)
                VALUES (${placeholders}, NOW())
                RETURNING *
            `;

            const result = await client.query(query, values);
            
            logger.info('Repository: Pagamento criado com sucesso', { 
                payment_id: result.rows[0].payment_id 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Repository: Erro ao criar pagamento', {
                error: error.message,
                data,
                tableName: this.tableName
            });
            throw new DatabaseError('Erro ao criar pagamento', error);
        }
    }

    /**
     * Atualiza pagamento com cliente de transação
     * @param {Object} client - Cliente de transação
     * @param {number} id - ID do pagamento
     * @param {Object} data - Dados para atualização
     * @returns {Promise<Object>} Pagamento atualizado
     */
    async updateWithClient(client, id, data) {
        try {
            logger.info('Repository: Atualizando pagamento com cliente de transação', { 
                id, 
                data 
            });

            const setColumns = Object.keys(data)
                .map((key, index) => `${key} = $${index + 2}`)
                .join(', ');

            const query = `
                UPDATE ${this.tableName}
                SET ${setColumns}, updated_at = NOW()
                WHERE ${this.primaryKey} = $1
                RETURNING *
            `;

            const values = [id, ...Object.values(data)];

            const result = await client.query(query, values);
            
            if (result.rows.length === 0) {
                throw new DatabaseError(`Pagamento com ID ${id} não encontrado`);
            }

            logger.info('Repository: Pagamento atualizado com sucesso', { 
                payment_id: result.rows[0].payment_id 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Repository: Erro ao atualizar pagamento', {
                error: error.message,
                id,
                data,
                tableName: this.tableName
            });
            throw new DatabaseError('Erro ao atualizar pagamento', error);
        }
    }

    /**
     * Remove pagamento com cliente de transação
     * @param {Object} client - Cliente de transação
     * @param {number} id - ID do pagamento
     * @returns {Promise<Object>} Pagamento removido
     */
    async deleteWithClient(client, id) {
        try {
            logger.info('Repository: Removendo pagamento com cliente de transação', { id });

            const query = `
                DELETE FROM ${this.tableName}
                WHERE ${this.primaryKey} = $1
                RETURNING *
            `;

            const result = await client.query(query, [id]);
            
            if (result.rows.length === 0) {
                throw new DatabaseError(`Pagamento com ID ${id} não encontrado`);
            }

            logger.info('Repository: Pagamento removido com sucesso', { 
                payment_id: result.rows[0].payment_id 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Repository: Erro ao remover pagamento', {
                error: error.message,
                id,
                tableName: this.tableName
            });
            throw new DatabaseError('Erro ao remover pagamento', error);
        }
    }
}

module.exports = MovementPaymentRepository;
