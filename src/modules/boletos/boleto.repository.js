const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');
const { DatabaseError } = require('../../utils/errors');
const { systemDatabase } = require('../../config/database');

class BoletoRepository extends BaseRepository {
    constructor() {
        super('boletos', 'boleto_id');
        this.pool = systemDatabase.pool;
    }

    /**
     * Lista todos os boletos com paginação e filtros
     */
    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const queryParams = [];
            const conditions = [];
            let paramCount = 1;

            // Filtros básicos
            if (filters.status) {
                conditions.push(`b.status = $${paramCount}`);
                queryParams.push(filters.status);
                paramCount++;
            }

            if (filters.installment_id) {
                conditions.push(`b.installment_id = $${paramCount}`);
                queryParams.push(filters.installment_id);
                paramCount++;
            }

            if (filters.boleto_number) {
                conditions.push(`b.boleto_number ILIKE $${paramCount}`);
                queryParams.push(`%${filters.boleto_number}%`);
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

            // Calcula o offset para paginação
            const offset = (page - 1) * limit;

            // Query principal
            const query = `
                SELECT 
                    b.*,
                    i.installment_number,
                    i.amount,
                    i.due_date
                FROM boletos b
                LEFT JOIN installments i ON i.installment_id = b.installment_id
                ${whereClause}
                ORDER BY b.generated_at DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            // Query de contagem
            const countQuery = `
                SELECT COUNT(*) as total
                FROM boletos b
                LEFT JOIN installments i ON i.installment_id = b.installment_id
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
            logger.error('Erro ao buscar boletos', {
                error: error.message,
                page,
                limit,
                filters
            });
            throw new DatabaseError('Erro ao buscar boletos');
        }
    }

    /**
     * Busca um boleto por ID
     */
    async findById(boletoId) {
        try {
            const query = `
                SELECT 
                    b.*,
                    i.installment_number,
                    i.amount,
                    i.due_date
                FROM boletos b
                LEFT JOIN installments i ON i.installment_id = b.installment_id
                WHERE b.boleto_id = $1
            `;

            const result = await this.pool.query(query, [boletoId]);

            if (result.rowCount === 0) {
                return null;
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar boleto por ID', {
                error: error.message,
                boletoId
            });
            throw new DatabaseError('Erro ao buscar boleto');
        }
    }

    /**
     * Atualiza um boleto existente
     */
    async updateBoleto(boletoId, data) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                UPDATE boletos
                SET 
                    status = $1,
                    last_status_update = NOW()
                WHERE boleto_id = $2
                RETURNING *
            `;

            const values = [data.status, boletoId];
            const result = await client.query(query, values);

            if (result.rowCount === 0) {
                throw new Error('Boleto não encontrado');
            }

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erro ao atualizar boleto', {
                error: error.message,
                boletoId,
                data
            });
            throw new DatabaseError('Erro ao atualizar boleto');
        } finally {
            client.release();
        }
    }

    /**
     * Cria um novo boleto
     */
    async createBoleto(data) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                INSERT INTO boletos (
                    installment_id,
                    due_date,
                    amount,
                    status,
                    description,
                    payer_id
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `;

            const values = [
                data.installment_id,
                data.due_date,
                data.amount,
                'A Emitir',
                data.description,
                data.payer_id
            ];

            const result = await client.query(query, values);
            await client.query('COMMIT');

            logger.info('Boleto criado com sucesso', { 
                boletoId: result.rows[0].boleto_id 
            });

            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erro ao criar boleto no banco', {
                error: error.message,
                data
            });
            throw new DatabaseError('Erro ao criar boleto');
        } finally {
            client.release();
        }
    }
}

module.exports = BoletoRepository;
