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
                    i.installment_id,
                    i.payment_id,
                    i.installment_number,
                    i.due_date,
                    i.amount,
                    i.balance,
                    i.status,
                    i.account_entry_id,
                    i.expected_date,
                    b.boleto_id,
                    b.boleto_url,
                    b.status AS boleto_status,
                    b.generated_at
                FROM installments i
                LEFT JOIN boletos b ON b.installment_id = i.installment_id
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

            // Filtro por status
            if (filters.status) {
                query += ` AND i.status = $${paramCount}`;
                params.push(filters.status);
                paramCount++;
            }

            // Filtro por payment_id
            if (filters.payment_id) {
                query += ` AND i.payment_id = $${paramCount}`;
                params.push(filters.payment_id);
                paramCount++;
            }

            // Filtro por data de vencimento
            if (filters.start_date) {
                query += ` AND i.due_date >= $${paramCount}`;
                params.push(filters.start_date);
                paramCount++;
            }

            if (filters.end_date) {
                query += ` AND i.due_date <= $${paramCount}`;
                params.push(filters.end_date);
                paramCount++;
            }

            // Adicionar ordenação
            query += ` ORDER BY i.due_date DESC, b.generated_at DESC`;

            // Adicionar paginação
            query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(validLimit, offset);

            // Consulta total de registros
            const countQuery = `
                SELECT COUNT(DISTINCT i.installment_id) as total 
                FROM installments i
                WHERE 1=1
                ${filters.status ? ` AND i.status = '${filters.status}'` : ''}
                ${filters.payment_id ? ` AND i.payment_id = ${filters.payment_id}` : ''}
                ${filters.start_date ? ` AND i.due_date >= '${filters.start_date}'` : ''}
                ${filters.end_date ? ` AND i.due_date <= '${filters.end_date}'` : ''}
            `;

            const [dataResult, countResult] = await Promise.all([
                this.pool.query(query, params),
                this.pool.query(countQuery)
            ]);

            // Agrupar boletos por installment
            const installmentsMap = new Map();
            dataResult.rows.forEach(row => {
                if (!installmentsMap.has(row.installment_id)) {
                    const { boleto_id, boleto_url, boleto_status, generated_at, ...installmentData } = row;
                    installmentsMap.set(row.installment_id, {
                        ...installmentData,
                        boletos: []
                    });
                }

                // Adicionar boleto se existir
                if (row.boleto_id) {
                    const installment = installmentsMap.get(row.installment_id);
                    installment.boletos.push({
                        id: row.boleto_id,
                        url: row.boleto_url,
                        status: row.boleto_status,
                        generated_at: row.generated_at
                    });
                }
            });

            const transformedData = Array.from(installmentsMap.values());

            logger.info('Installments encontrados', { 
                total: countResult.rows[0].total, 
                returned: transformedData.length 
            });

            return {
                data: transformedData,
                total: parseInt(countResult.rows[0].total)
            };
        } catch (error) {
            logger.error('Erro ao buscar installments', { 
                errorMessage: error.message, 
                filters 
            });
            throw new ValidationError('Erro ao buscar parcelas');
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
                SELECT 
                    i.installment_id,
                    i.payment_id,
                    i.installment_number,
                    i.due_date,
                    i.amount,
                    i.balance,
                    i.status,
                    i.account_entry_id,
                    i.expected_date,
                    b.boleto_id,
                    b.boleto_url,
                    b.status AS boleto_status,
                    b.generated_at
                FROM installments i
                LEFT JOIN boletos b ON b.installment_id = i.installment_id
                WHERE i.installment_id = $1
                ORDER BY b.generated_at DESC
            `;

            const result = await this.pool.query(query, [installmentId]);
            
            if (result.rows.length === 0) {
                return null;
            }

            // Agrupar boletos
            const installmentData = {
                ...result.rows[0],
                boletos: []
            };

            result.rows.forEach(row => {
                if (row.boleto_id) {
                    installmentData.boletos.push({
                        id: row.boleto_id,
                        url: row.boleto_url,
                        status: row.boleto_status,
                        generated_at: row.generated_at
                    });
                }
            });

            // Remover campos duplicados
            const { boleto_id, boleto_url, boleto_status, generated_at, ...cleanInstallmentData } = installmentData;

            return {
                ...cleanInstallmentData,
                boletos: installmentData.boletos
            };
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
