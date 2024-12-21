const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');

class PaymentMethodRepository extends BaseRepository {
    constructor() {
        super('payment_methods', 'payment_method_id');
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
                FROM payment_methods
                ${whereClause}
                ORDER BY created_at DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;

            // Query de contagem
            const countQuery = `
                SELECT COUNT(*) as total
                FROM payment_methods
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
                this.pool.query(query, queryParams),
                this.pool.query(countQuery, queryParams.slice(0, -2))
            ]);

            return {
                rows: result.rows,
                count: parseInt(countResult.rows[0].total)
            };
        } catch (error) {
            logger.error('Erro ao listar formas de pagamento', {
                error: error.message,
                page,
                limit,
                filters
            });
            throw error;
        }
    }

    /**
     * Busca forma de pagamento por ID
     */
    async findById(id) {
        try {
            const query = `
                SELECT *
                FROM payment_methods
                WHERE payment_method_id = $1
                AND deleted_at IS NULL
            `;

            const { rows } = await this.pool.query(query, [id]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao buscar forma de pagamento', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    /**
     * Cria uma nova forma de pagamento
     */
    async create(data) {
        try {
            const query = `
                INSERT INTO payment_methods (
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
            throw error;
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
                UPDATE payment_methods
                SET ${updates.join(', ')}
                WHERE payment_method_id = $${paramCount}
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
            throw error;
        }
    }

    /**
     * Remove uma forma de pagamento (soft delete)
     */
    async delete(id) {
        try {
            const query = `
                UPDATE payment_methods
                SET deleted_at = NOW()
                WHERE payment_method_id = $1
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
            throw error;
        }
    }
}

module.exports = PaymentMethodRepository;
