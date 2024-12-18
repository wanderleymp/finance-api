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

    async findById(installmentId) {
        try {
            const query = `
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
                WHERE installment_id = $1
            `;

            const result = await this.pool.query(query, [installmentId]);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Erro no repositório ao buscar installment por ID', {
                errorMessage: error.message,
                installmentId
            });
            throw new ValidationError('Erro ao buscar installment');
        }
    }
}

module.exports = new InstallmentRepository();
