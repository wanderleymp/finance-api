const { systemDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');
const { ValidationError } = require('../utils/errors');

class PaymentMethodsRepository {
    constructor() {
        this.pool = systemDatabase.pool;
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const { limit: validLimit, offset } = PaginationHelper.getPaginationParams(page, limit);
            
            let query = `
                SELECT * 
                FROM payment_methods 
                WHERE deleted_at IS NULL
            `;
            const params = [];
            let paramCount = 1;

            // Filtro por nome do método
            if (filters.method_name) {
                query += ` AND method_name ILIKE $${paramCount}`;
                params.push(`%${filters.method_name}%`);
                paramCount++;
            }

            // Filtro de status ativo/inativo
            if (filters.active !== undefined) {
                query += ` AND active = $${paramCount}`;
                params.push(filters.active);
                paramCount++;
            }

            // Consulta de contagem
            const countQuery = query.replace('*', 'COUNT(*)');
            
            // Adicionar ordenação e paginação
            query += ` ORDER BY payment_method_id DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(validLimit, offset);

            logger.info('Executando consulta findAll de payment methods', { 
                query,
                params,
                page,
                limit: validLimit,
                offset,
                filters
            });

            const [dataResult, countResult] = await Promise.all([
                systemDatabase.query(query, params),
                systemDatabase.query(countQuery, params.slice(0, -2))
            ]);

            return {
                data: dataResult.rows,
                total: parseInt(countResult.rows[0].count)
            };
        } catch (error) {
            logger.error('Erro ao buscar métodos de pagamento', { 
                errorMessage: error.message,
                stack: error.stack,
                filters
            });
            throw error;
        }
    }

    async findById(paymentMethodId) {
        try {
            const query = `
                SELECT * 
                FROM payment_methods 
                WHERE payment_method_id = $1 AND deleted_at IS NULL
            `;

            logger.info('Buscando método de pagamento por ID', { paymentMethodId });

            const result = await systemDatabase.query(query, [paymentMethodId]);

            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao buscar método de pagamento por ID', { 
                errorMessage: error.message,
                paymentMethodId
            });
            throw error;
        }
    }

    async create(paymentMethodData) {
        try {
            const query = `
                INSERT INTO payment_methods (
                    method_name, description, has_entry, installment_count, 
                    days_between_installments, first_due_date_days, account_entry_id, 
                    integration_mapping_id, payment_document_type_id, credential_id, 
                    bank_account_id, active
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
                ) RETURNING *
            `;

            const values = [
                paymentMethodData.method_name,
                paymentMethodData.description || null,
                paymentMethodData.has_entry || false,
                paymentMethodData.installment_count || 1,
                paymentMethodData.days_between_installments || 30,
                paymentMethodData.first_due_date_days || 30,
                paymentMethodData.account_entry_id || null,
                paymentMethodData.integration_mapping_id || null,
                paymentMethodData.payment_document_type_id || null,
                paymentMethodData.credential_id || null,
                paymentMethodData.bank_account_id || null,
                paymentMethodData.active !== undefined ? paymentMethodData.active : true
            ];

            logger.info('Criando novo método de pagamento', { 
                method_name: paymentMethodData.method_name
            });

            const result = await systemDatabase.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar método de pagamento', { 
                errorMessage: error.message,
                paymentMethodData
            });
            
            // Tratamento de erros específicos do banco de dados
            if (error.code === '23505') {  // Violação de restrição única
                throw new ValidationError('Já existe um método de pagamento com este nome');
            }
            
            throw error;
        }
    }

    async update(paymentMethodId, updateData) {
        try {
            const updateFields = [];
            const values = [];
            let paramCount = 1;

            // Campos atualizáveis
            const updateableFields = [
                'method_name', 'description', 'has_entry', 'installment_count', 
                'days_between_installments', 'first_due_date_days', 'account_entry_id', 
                'integration_mapping_id', 'payment_document_type_id', 'credential_id', 
                'bank_account_id', 'active'
            ];

            updateableFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    updateFields.push(`${field} = $${paramCount}`);
                    values.push(updateData[field]);
                    paramCount++;
                }
            });

            if (updateFields.length === 0) {
                throw new ValidationError('Nenhum campo para atualizar');
            }

            // Adicionar updated_at
            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(paymentMethodId);

            const query = `
                UPDATE payment_methods 
                SET ${updateFields.join(', ')}
                WHERE payment_method_id = $${paramCount} AND deleted_at IS NULL
                RETURNING *
            `;

            logger.info('Atualizando método de pagamento', { 
                paymentMethodId, 
                updatedFields: updateFields 
            });

            const result = await systemDatabase.query(query, values);

            if (result.rows.length === 0) {
                throw new ValidationError('Método de pagamento não encontrado');
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar método de pagamento', { 
                errorMessage: error.message,
                paymentMethodId,
                updateData
            });
            throw error;
        }
    }

    async delete(paymentMethodId) {
        try {
            const query = `
                UPDATE payment_methods 
                SET 
                    deleted_at = CURRENT_TIMESTAMP,
                    active = false
                WHERE payment_method_id = $1 AND deleted_at IS NULL
                RETURNING *
            `;

            logger.info('Deletando método de pagamento', { paymentMethodId });

            const result = await systemDatabase.query(query, [paymentMethodId]);

            if (result.rows.length === 0) {
                throw new ValidationError('Método de pagamento não encontrado');
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao deletar método de pagamento', { 
                errorMessage: error.message,
                paymentMethodId
            });
            throw error;
        }
    }
}

module.exports = new PaymentMethodsRepository();
