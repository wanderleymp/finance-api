const { systemDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');
const { ValidationError } = require('../utils/errors');

class InstallmentRepository {
    constructor() {
        this.pool = systemDatabase.pool;
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const { limit: validLimit, offset } = PaginationHelper.getPaginationParams(page, limit);
            
            let query = `
                SELECT 
                    installment_id,
                    payment_id,
                    installment_number,
                    due_date,
                    amount,
                    balance,
                    status,
                    account_entry_id,
                    expected_date
                FROM installments 
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

            // Filtro por status
            if (filters.status) {
                query += ` AND status = $${paramCount}`;
                params.push(filters.status);
                paramCount++;
            }

            // Filtro por payment_id
            if (filters.payment_id) {
                query += ` AND payment_id = $${paramCount}`;
                params.push(filters.payment_id);
                paramCount++;
            }

            // Filtro por data de vencimento
            if (filters.start_date) {
                query += ` AND due_date >= $${paramCount}`;
                params.push(filters.start_date);
                paramCount++;
            }

            if (filters.end_date) {
                query += ` AND due_date <= $${paramCount}`;
                params.push(filters.end_date);
                paramCount++;
            }

            // Ordenação padrão
            query += ` ORDER BY due_date`;

            // Adicionar paginação
            query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(validLimit, offset);

            // Executar consulta
            const result = await this.pool.query(query, params);

            // Contar total de registros
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM installments 
                WHERE 1=1
                ${filters.status ? ` AND status = '${filters.status}'` : ''}
                ${filters.payment_id ? ` AND payment_id = ${filters.payment_id}` : ''}
                ${filters.start_date ? ` AND due_date >= '${filters.start_date}'` : ''}
                ${filters.end_date ? ` AND due_date <= '${filters.end_date}'` : ''}
            `;
            const countResult = await this.pool.query(countQuery);
            const total = parseInt(countResult.rows[0].total);

            logger.info('Repositório: Listagem de installments', {
                totalInstallments: total,
                page,
                limit: validLimit,
                filters
            });

            return {
                data: result.rows,
                total
            };
        } catch (error) {
            logger.error('Erro no repositório ao listar installments', {
                errorMessage: error.message,
                filters
            });
            throw new ValidationError('Erro ao listar installments');
        }
    }

    async query(query, values) {
        try {
            const result = await this.pool.query(query, values);
            return result;
        } catch (error) {
            logger.error('Erro ao executar query no repositório de installments', {
                query,
                values,
                errorMessage: error.message
            });
            throw error;
        }
    }

    async createInstallment(installmentData) {
        try {
            logger.info('Attempting to create installment in repository:', JSON.stringify(installmentData));
            const query = `
                INSERT INTO installments 
                (payment_id, installment_number, due_date, amount, balance, status, account_entry_id, expected_date) 
                VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;

            const values = [
                installmentData.payment_id,
                installmentData.installment_number,
                installmentData.due_date,
                installmentData.amount,
                installmentData.balance,
                installmentData.status,
                installmentData.account_entry_id,
                installmentData.expected_date
            ];

            logger.info('Executing query with values:', JSON.stringify(values));

            const result = await this.pool.query(query, values);

            logger.info('Installment created successfully:', JSON.stringify(result.rows[0]));
            return result.rows[0];
        } catch (error) {
            logger.error('Error creating installment in repository:', error);
            throw error;
        }
    }

    async updateInstallment(installmentId, installmentData) {
        try {
            const updateFields = [];
            const values = [];
            let index = 1;

            // Construir campos dinâmicos para atualização
            if (installmentData.payment_id) {
                updateFields.push(`payment_id = $${index++}`);
                values.push(installmentData.payment_id);
            }
            if (installmentData.installment_number) {
                updateFields.push(`installment_number = $${index++}`);
                values.push(installmentData.installment_number);
            }
            if (installmentData.due_date) {
                updateFields.push(`due_date = $${index++}`);
                values.push(installmentData.due_date);
            }
            if (installmentData.amount) {
                updateFields.push(`amount = $${index++}`);
                values.push(installmentData.amount);
            }
            if (installmentData.balance) {
                updateFields.push(`balance = $${index++}`);
                values.push(installmentData.balance);
            }
            if (installmentData.status) {
                updateFields.push(`status = $${index++}`);
                values.push(installmentData.status);
            }
            if (installmentData.expected_date) {
                updateFields.push(`expected_date = $${index++}`);
                values.push(installmentData.expected_date);
            }

            values.push(installmentId);

            const query = `
                UPDATE installments 
                SET ${updateFields.join(', ')}
                WHERE installment_id = $${index}
                RETURNING *
            `;

            const result = await this.pool.query(query, values);
            
            if (result.rows.length === 0) {
                throw new Error('Installment não encontrado');
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Erro no repositório ao atualizar installment', {
                installmentId,
                installmentData,
                errorMessage: error.message
            });
            throw error;
        }
    }

    async deleteInstallment(installmentId) {
        try {
            const query = `
                DELETE FROM installments 
                WHERE installment_id = $1
                RETURNING *
            `;

            const result = await this.pool.query(query, [installmentId]);
            
            if (result.rows.length === 0) {
                throw new Error('Installment não encontrado');
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Erro no repositório ao deletar installment', {
                installmentId,
                errorMessage: error.message
            });
            throw error;
        }
    }

    async findById(installmentId) {
        try {
            const query = `
                SELECT * FROM installments 
                WHERE installment_id = $1
            `;

            const result = await this.pool.query(query, [installmentId]);
            
            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Erro no repositório ao buscar installment por ID', {
                installmentId,
                errorMessage: error.message
            });
            throw error;
        }
    }
}

module.exports = new InstallmentRepository();
