const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');

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

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const queryParams = [];
            const conditions = [];
            let paramCount = 1;

            if (filters.payment_id) {
                conditions.push(`payment_id = $${paramCount}`);
                queryParams.push(filters.payment_id);
                paramCount++;
            }

            if (filters.status) {
                conditions.push(`status = $${paramCount}`);
                queryParams.push(filters.status);
                paramCount++;
            }

            if (filters.start_date) {
                conditions.push(`due_date >= $${paramCount}`);
                queryParams.push(filters.start_date);
                paramCount++;
            }

            if (filters.end_date) {
                conditions.push(`due_date <= $${paramCount}`);
                queryParams.push(filters.end_date);
                paramCount++;
            }

            if (filters.account_entry_id) {
                conditions.push(`account_entry_id = $${paramCount}`);
                queryParams.push(filters.account_entry_id);
                paramCount++;
            }

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

            const query = `
                SELECT *
                FROM ${this.tableName}
                ${whereClause}
                ORDER BY due_date ASC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            queryParams.push(limit, (page - 1) * limit);

            const countQuery = `
                SELECT COUNT(*) as total
                FROM ${this.tableName}
                ${whereClause}
            `;

            const client = await this.pool.connect();
            try {
                const [result, countResult] = await Promise.all([
                    client.query(query, queryParams),
                    client.query(countQuery, queryParams.slice(0, -2))
                ]);

                return {
                    data: result.rows,
                    pagination: {
                        total: parseInt(countResult.rows[0].total),
                        page: parseInt(page),
                        limit: parseInt(limit)
                    }
                };
            } finally {
                client.release();
            }
        } catch (error) {
            logger.error('Erro ao listar parcelas', { error });
            throw error;
        }
    }

    async create(data) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                INSERT INTO ${this.tableName} (
                    payment_id,
                    due_date,
                    amount,
                    status,
                    installment_number,
                    total_installments,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                RETURNING *
            `;

            const result = await client.query(query, [
                data.payment_id,
                data.due_date,
                data.amount,
                data.status,
                data.installment_number,
                data.total_installments
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
