const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');
const { DatabaseError } = require('../../utils/errors');

class InstallmentRepository extends BaseRepository {
    constructor() {
        super('installments', 'installment_id');
    }

    /**
     * Busca parcelas de um movimento
     */
    async findByMovementId(movementId) {
        try {
            const query = `
                SELECT 
                    i.*,
                    ist.name as status_name
                FROM installments i
                LEFT JOIN installment_status ist ON ist.status_id = i.status_id
                WHERE i.movement_id = $1
                ORDER BY i.installment_number
            `;

            const { rows } = await this.pool.query(query, [movementId]);
            return rows;
        } catch (error) {
            logger.error('Erro ao buscar parcelas do movimento', {
                error: error.message,
                movementId
            });
            throw error;
        }
    }

    /**
     * Busca parcelas de um pagamento
     */
    async findByPaymentId(paymentId) {
        try {
            const query = `
                SELECT i.*
                FROM installments i
                WHERE i.payment_id = $1
                ORDER BY i.installment_number
            `;

            const { rows } = await this.pool.query(query, [paymentId]);
            return rows;
        } catch (error) {
            logger.error('Erro ao buscar parcelas do pagamento', {
                error: error.message,
                paymentId
            });
            throw error;
        }
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const queryParams = [];
            const conditions = [];
            let paramCount = 1;

            // Filtros básicos
            if (filters.status) {
                conditions.push(`i.status = $${paramCount}`);
                queryParams.push(filters.status);
                paramCount++;
            }

            if (filters.account_entry_id) {
                conditions.push(`i.account_entry_id = $${paramCount}`);
                queryParams.push(filters.account_entry_id);
                paramCount++;
            }

            if (filters.start_date) {
                conditions.push(`i.due_date >= $${paramCount}`);
                queryParams.push(filters.start_date);
                paramCount++;
            }

            if (filters.end_date) {
                conditions.push(`i.due_date <= $${paramCount}`);
                queryParams.push(filters.end_date);
                paramCount++;
            }

            const whereClause = conditions.length > 0 
                ? `WHERE ${conditions.join(' AND ')}` 
                : '';

            const offset = (page - 1) * limit;

            // Query base
            let query = `
                SELECT 
                    i.*
                FROM installments i
                ${whereClause}
                ORDER BY i.due_date DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            // Query de contagem
            const countQuery = `
                SELECT COUNT(*) as total
                FROM installments i
                ${whereClause}
            `;

            // Adiciona parâmetros de paginação
            queryParams.push(limit, offset);

            // Executa as queries
            const [resultQuery, countResult] = await Promise.all([
                this.pool.query(query, queryParams),
                this.pool.query(countQuery, queryParams.slice(0, -2))
            ]);

            const total = parseInt(countResult.rows[0].total);
            const totalPages = Math.ceil(total / limit);

            // Se include=boletos, busca os boletos para cada parcela
            if (filters.include === 'boletos') {
                const installmentIds = resultQuery.rows.map(row => row.installment_id);
                
                if (installmentIds.length > 0) {
                    const boletosQuery = `
                        SELECT 
                            b.boleto_id,
                            b.installment_id,
                            b.status,
                            b.generated_at,
                            b.boleto_number
                        FROM boletos b
                        WHERE b.installment_id = ANY($1)
                        ORDER BY b.generated_at DESC
                    `;

                    const boletosResult = await this.pool.query(boletosQuery, [installmentIds]);
                    
                    // Agrupa os boletos por installment_id
                    const boletosMap = boletosResult.rows.reduce((acc, boleto) => {
                        if (!acc[boleto.installment_id]) {
                            acc[boleto.installment_id] = [];
                        }
                        acc[boleto.installment_id].push(boleto);
                        return acc;
                    }, {});

                    // Adiciona os boletos a cada parcela
                    resultQuery.rows = resultQuery.rows.map(installment => ({
                        ...installment,
                        boletos: boletosMap[installment.installment_id] || []
                    }));
                }
            }

            return {
                data: resultQuery.rows,
                pagination: {
                    total,
                    totalPages,
                    currentPage: page,
                    limit
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar parcelas', {
                error: error.message,
                page,
                limit,
                filters
            });
            throw new DatabaseError('Erro ao buscar parcelas');
        }
    }

    async create(data) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                INSERT INTO ${this.tableName} (
                    payment_id,
                    installment_number,
                    due_date,
                    amount,
                    balance,
                    status,
                    account_entry_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;

            const result = await client.query(query, [
                data.payment_id,
                data.installment_number,
                data.due_date,
                data.amount,
                data.balance,
                data.status,
                data.account_entry_id
            ]);

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async update(id, data) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                UPDATE ${this.tableName}
                SET 
                    status = COALESCE($1, status),
                    payment_date = COALESCE($2, payment_date),
                    updated_at = NOW()
                WHERE ${this.primaryKey} = $3
                RETURNING *
            `;

            const result = await client.query(query, [
                data.status,
                data.payment_date,
                id
            ]);

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = InstallmentRepository;
