const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');
const { DatabaseError } = require('../../utils/errors');

class PaymentMethodRepository extends BaseRepository {
    constructor() {
        super('payment_methods', 'payment_method_id');
    }

    /**
     * Cria um método de pagamento com cliente de transação
     * @param {Object} client - Cliente de transação
     * @param {Object} data - Dados do método de pagamento
     * @returns {Promise<Object>} Método de pagamento criado
     */
    async createWithClient(client, data) {
        try {
            logger.info('Repository: Criando método de pagamento com cliente de transação', { data });

            const columns = Object.keys(data);
            const values = Object.values(data);
            const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

            const query = `
                INSERT INTO ${this.tableName} (${columns.join(', ')}, created_at)
                VALUES (${placeholders}, NOW())
                RETURNING *
            `;

            const result = await client.query(query, values);
            
            logger.info('Repository: Método de pagamento criado com sucesso', { 
                payment_method_id: result.rows[0].payment_method_id 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Repository: Erro ao criar método de pagamento', {
                error: error.message,
                data,
                tableName: this.tableName
            });
            throw new DatabaseError('Erro ao criar método de pagamento', error);
        }
    }

    /**
     * Atualiza método de pagamento com cliente de transação
     * @param {Object} client - Cliente de transação
     * @param {number} id - ID do método de pagamento
     * @param {Object} data - Dados para atualização
     * @returns {Promise<Object>} Método de pagamento atualizado
     */
    async updateWithClient(client, id, data) {
        try {
            logger.info('Repository: Atualizando método de pagamento com cliente de transação', { 
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
                throw new DatabaseError(`Método de pagamento com ID ${id} não encontrado`);
            }

            logger.info('Repository: Método de pagamento atualizado com sucesso', { 
                payment_method_id: result.rows[0].payment_method_id 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Repository: Erro ao atualizar método de pagamento', {
                error: error.message,
                id,
                data,
                tableName: this.tableName
            });
            throw new DatabaseError('Erro ao atualizar método de pagamento', error);
        }
    }

    /**
     * Remove método de pagamento com cliente de transação
     * @param {Object} client - Cliente de transação
     * @param {number} id - ID do método de pagamento
     * @returns {Promise<Object>} Método de pagamento removido
     */
    async deleteWithClient(client, id) {
        try {
            logger.info('Repository: Removendo método de pagamento com cliente de transação', { id });

            const query = `
                DELETE FROM ${this.tableName}
                WHERE ${this.primaryKey} = $1
                RETURNING *
            `;

            const result = await client.query(query, [id]);
            
            if (result.rows.length === 0) {
                throw new DatabaseError(`Método de pagamento com ID ${id} não encontrado`);
            }

            logger.info('Repository: Método de pagamento removido com sucesso', { 
                payment_method_id: result.rows[0].payment_method_id 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Repository: Erro ao remover método de pagamento', {
                error: error.message,
                id,
                tableName: this.tableName
            });
            throw new DatabaseError('Erro ao remover método de pagamento', error);
        }
    }

    /**
     * Lista formas de pagamento com filtros
     */
    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            // Prepara os parâmetros da query
            const offset = (page - 1) * limit;
            const queryParams = [];
            let paramCount = 0;

            // Monta a cláusula WHERE
            const conditions = [];
            if (filters.method_name) {
                paramCount++;
                queryParams.push(`%${filters.method_name}%`);
                conditions.push(`method_name ILIKE $${paramCount}`);
            }
            if (filters.active !== undefined) {
                paramCount++;
                queryParams.push(filters.active);
                conditions.push(`active = $${paramCount}`);
            }
            conditions.push('deleted_at IS NULL');

            const whereClause = conditions.length > 0 
                ? `WHERE ${conditions.join(' AND ')}` 
                : '';

            // Query principal
            const query = `
                SELECT *
                FROM ${this.tableName}
                ${whereClause}
                ORDER BY created_at DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;

            // Query de contagem
            const countQuery = `
                SELECT COUNT(*) as total
                FROM ${this.tableName}
                ${whereClause}
            `;

            queryParams.push(limit, offset);

            // Executa as queries
            const [result, countResult] = await Promise.all([
                this.pool.query(query, queryParams),
                this.pool.query(countQuery, queryParams.slice(0, -2))
            ]);

            return {
                data: result.rows,
                total: parseInt(countResult.rows[0].total),
                page,
                limit
            };
        } catch (error) {
            logger.error('Erro ao buscar métodos de pagamento', {
                error: error.message,
                page,
                limit,
                filters
            });
            throw new DatabaseError('Erro ao buscar métodos de pagamento', error);
        }
    }

    /**
     * Busca forma de pagamento por ID
     */
    async findById(id) {
        try {
            const query = `
                SELECT *
                FROM ${this.tableName}
                WHERE ${this.primaryKey} = $1
                AND deleted_at IS NULL
            `;

            const { rows } = await this.pool.query(query, [id]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao buscar forma de pagamento', {
                error: error.message,
                id
            });
            throw new DatabaseError('Erro ao buscar forma de pagamento', error);
        }
    }

    /**
     * Cria uma nova forma de pagamento
     */
    async create(data) {
        try {
            const query = `
                INSERT INTO ${this.tableName} (
                    method_name,
                    description,
                    has_entry,
                    installment_count,
                    days_between_installments,
                    first_due_date_days,
                    account_entry_id,
                    integration_mapping_id,
                    payment_document_type_id,
                    credential_id,
                    bank_account_id,
                    active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *
            `;

            const { rows } = await this.pool.query(query, [
                data.method_name,
                data.description,
                data.has_entry || false,
                data.installment_count || 1,
                data.days_between_installments || 30,
                data.first_due_date_days || 30,
                data.account_entry_id,
                data.integration_mapping_id,
                data.payment_document_type_id,
                data.credential_id,
                data.bank_account_id,
                data.active !== undefined ? data.active : true
            ]);

            return rows[0];
        } catch (error) {
            logger.error('Erro ao criar forma de pagamento', {
                error: error.message,
                data
            });
            throw new DatabaseError('Erro ao criar forma de pagamento', error);
        }
    }

    /**
     * Atualiza uma forma de pagamento
     */
    async update(id, data) {
        try {
            const updates = [];
            const values = [];
            let paramCount = 1;

            if (data.method_name !== undefined) {
                updates.push(`method_name = $${paramCount}`);
                values.push(data.method_name);
                paramCount++;
            }

            if (data.description !== undefined) {
                updates.push(`description = $${paramCount}`);
                values.push(data.description);
                paramCount++;
            }

            if (data.has_entry !== undefined) {
                updates.push(`has_entry = $${paramCount}`);
                values.push(data.has_entry);
                paramCount++;
            }

            if (data.installment_count !== undefined) {
                updates.push(`installment_count = $${paramCount}`);
                values.push(data.installment_count);
                paramCount++;
            }

            if (data.days_between_installments !== undefined) {
                updates.push(`days_between_installments = $${paramCount}`);
                values.push(data.days_between_installments);
                paramCount++;
            }

            if (data.first_due_date_days !== undefined) {
                updates.push(`first_due_date_days = $${paramCount}`);
                values.push(data.first_due_date_days);
                paramCount++;
            }

            if (data.account_entry_id !== undefined) {
                updates.push(`account_entry_id = $${paramCount}`);
                values.push(data.account_entry_id);
                paramCount++;
            }

            if (data.integration_mapping_id !== undefined) {
                updates.push(`integration_mapping_id = $${paramCount}`);
                values.push(data.integration_mapping_id);
                paramCount++;
            }

            if (data.payment_document_type_id !== undefined) {
                updates.push(`payment_document_type_id = $${paramCount}`);
                values.push(data.payment_document_type_id);
                paramCount++;
            }

            if (data.credential_id !== undefined) {
                updates.push(`credential_id = $${paramCount}`);
                values.push(data.credential_id);
                paramCount++;
            }

            if (data.bank_account_id !== undefined) {
                updates.push(`bank_account_id = $${paramCount}`);
                values.push(data.bank_account_id);
                paramCount++;
            }

            if (data.active !== undefined) {
                updates.push(`active = $${paramCount}`);
                values.push(data.active);
                paramCount++;
            }

            if (updates.length === 0) {
                throw new Error('Nenhum campo para atualizar');
            }

            updates.push(`updated_at = NOW()`);
            values.push(id);

            const query = `
                UPDATE ${this.tableName}
                SET ${updates.join(', ')}
                WHERE ${this.primaryKey} = $${paramCount}
                AND deleted_at IS NULL
                RETURNING *
            `;

            const { rows } = await this.pool.query(query, values);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar forma de pagamento', {
                error: error.message,
                id,
                data
            });
            throw new DatabaseError('Erro ao atualizar forma de pagamento', error);
        }
    }

    /**
     * Remove uma forma de pagamento (soft delete)
     */
    async delete(id) {
        try {
            const query = `
                UPDATE ${this.tableName}
                SET deleted_at = NOW()
                WHERE ${this.primaryKey} = $1
                AND deleted_at IS NULL
                RETURNING *
            `;

            const { rows } = await this.pool.query(query, [id]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao remover forma de pagamento', {
                error: error.message,
                id
            });
            throw new DatabaseError('Erro ao remover forma de pagamento', error);
        }
    }
}

module.exports = PaymentMethodRepository;
