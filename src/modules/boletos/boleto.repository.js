const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');
const { DatabaseError } = require('../../utils/errors');

class BoletoRepository extends BaseRepository {
    constructor() {
        super('boletos', 'boleto_id');
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

            const offset = (page - 1) * limit;

            const query = `
                SELECT 
                    b.*,
                    i.due_date,
                    i.total_amount,
                    COUNT(*) OVER() as total_count
                FROM boletos b
                JOIN installments i ON b.installment_id = i.installment_id
                ${whereClause}
                ORDER BY i.due_date DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            queryParams.push(limit, offset);

            const result = await this.query(query, queryParams);

            return {
                data: result.rows,
                total: result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0,
                page,
                limit
            };
        } catch (error) {
            logger.error('Erro ao buscar boletos', {
                error: error.message,
                filters,
                page,
                limit
            });
            throw new DatabaseError('Erro ao buscar boletos', error);
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

            const result = await this.query(query, [boletoId]);

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
        try {
            const query = `
                UPDATE boletos
                SET 
                    status = $1,
                    last_status_update = NOW()
                WHERE boleto_id = $2
                RETURNING *
            `;

            const values = [data.status, boletoId];
            const result = await this.query(query, values);

            if (result.rowCount === 0) {
                throw new Error('Boleto não encontrado');
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar boleto', {
                error: error.message,
                boletoId,
                data
            });
            throw new DatabaseError('Erro ao atualizar boleto');
        }
    }

    /**
     * Cria um novo boleto
     */
    async createBoleto(data) {
        try {
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

            const result = await this.query(query, values);

            logger.info('Boleto criado com sucesso', { 
                boletoId: result.rows[0].boleto_id 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar boleto no banco', {
                error: error.message,
                data
            });
            throw new DatabaseError('Erro ao criar boleto');
        }
    }
}

module.exports = BoletoRepository;
