const { systemDatabase } = require('../../config/database');
const { logger } = require('../../middlewares/logger');
const IBoletoRepository = require('./interfaces/IBoletoRepository');
const PaginationHelper = require('../../utils/paginationHelper');
const { DatabaseError } = require('../../utils/errors');

class BoletoRepository extends IBoletoRepository {
    constructor() {
        super();
        this.pool = systemDatabase.pool;
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
                    description
                ) VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;

            const values = [
                data.installment_id,
                data.due_date,
                data.amount,
                data.status || 'A Emitir',
                data.description
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
            throw new DatabaseError('Erro ao criar boleto', error);
        } finally {
            client.release();
        }
    }

    /**
     * Lista boletos com paginação e filtros
     */
    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const { limit: validLimit, offset } = PaginationHelper.getPaginationParams(page, limit);
            
            let query = `
                SELECT 
                    b.*,
                    i.installment_number,
                    i.total_installments,
                    p.person_name as payer_name
                FROM boletos b
                LEFT JOIN installments i ON b.installment_id = i.installment_id
                LEFT JOIN persons p ON i.payer_id = p.person_id
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

            // Filtros dinâmicos
            if (filters.status) {
                query += ` AND b.status = $${paramCount}`;
                params.push(filters.status);
                paramCount++;
            }

            if (filters.installment_id) {
                query += ` AND b.installment_id = $${paramCount}`;
                params.push(filters.installment_id);
                paramCount++;
            }

            if (filters.movement_id) {
                query += ` AND i.movement_id = $${paramCount}`;
                params.push(filters.movement_id);
                paramCount++;
            }

            if (filters.start_date) {
                query += ` AND b.due_date >= $${paramCount}`;
                params.push(filters.start_date);
                paramCount++;
            }

            if (filters.end_date) {
                query += ` AND b.due_date <= $${paramCount}`;
                params.push(filters.end_date);
                paramCount++;
            }

            if (filters.payer_id) {
                query += ` AND i.payer_id = $${paramCount}`;
                params.push(filters.payer_id);
                paramCount++;
            }

            // Consulta de contagem
            const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM');
            const countResult = await this.pool.query(countQuery, params);
            const total = parseInt(countResult.rows[0].count);

            // Adicionar ordenação e paginação
            query += ` ORDER BY b.due_date ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(validLimit, offset);

            const result = await this.pool.query(query, params);

            return {
                data: result.rows,
                meta: {
                    total,
                    page,
                    limit: validLimit,
                    pages: Math.ceil(total / validLimit)
                }
            };
        } catch (error) {
            logger.error('Erro ao listar boletos no banco', {
                error: error.message,
                filters
            });
            throw new DatabaseError('Erro ao listar boletos', error);
        }
    }

    /**
     * Busca boleto por ID
     */
    async findById(id) {
        try {
            const query = `
                SELECT 
                    b.*,
                    i.installment_number,
                    i.total_installments,
                    p.person_name as payer_name
                FROM boletos b
                LEFT JOIN installments i ON b.installment_id = i.installment_id
                LEFT JOIN persons p ON i.payer_id = p.person_id
                WHERE b.boleto_id = $1
            `;

            const result = await this.pool.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao buscar boleto por ID no banco', {
                error: error.message,
                boletoId: id
            });
            throw new DatabaseError('Erro ao buscar boleto', error);
        }
    }

    /**
     * Atualiza um boleto
     */
    async update(id, data) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const updateFields = [];
            const values = [id];
            let paramCount = 2;

            if (data.due_date !== undefined) {
                updateFields.push(`due_date = $${paramCount}`);
                values.push(data.due_date);
                paramCount++;
            }

            if (data.amount !== undefined) {
                updateFields.push(`amount = $${paramCount}`);
                values.push(data.amount);
                paramCount++;
            }

            if (data.status !== undefined) {
                updateFields.push(`status = $${paramCount}`);
                values.push(data.status);
                paramCount++;
            }

            if (data.response_data !== undefined) {
                updateFields.push(`response_data = $${paramCount}`);
                values.push(data.response_data);
                paramCount++;
            }

            const query = `
                UPDATE boletos 
                SET ${updateFields.join(', ')},
                    updated_at = CURRENT_TIMESTAMP
                WHERE boleto_id = $1
                RETURNING *
            `;

            const result = await client.query(query, values);
            await client.query('COMMIT');

            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erro ao atualizar boleto no banco', {
                error: error.message,
                boletoId: id,
                data
            });
            throw new DatabaseError('Erro ao atualizar boleto', error);
        } finally {
            client.release();
        }
    }

    /**
     * Atualiza o status de um boleto
     */
    async updateStatus(id, status, responseData = null) {
        return this.update(id, { 
            status, 
            response_data: responseData 
        });
    }

    /**
     * Busca parcelas de um movimento
     */
    async getParcelasMovimento(movimentoId) {
        try {
            const query = `
                SELECT 
                    i.*,
                    p.person_id as payer_id,
                    p.person_name as payer_name
                FROM installments i
                JOIN movements m ON i.movement_id = m.movement_id
                JOIN persons p ON m.person_id = p.person_id
                WHERE i.movement_id = $1
                AND i.status = 'Aberto'
                AND NOT EXISTS (
                    SELECT 1 FROM boletos b 
                    WHERE b.installment_id = i.installment_id
                    AND b.status != 'Cancelado'
                )
                ORDER BY i.installment_number
            `;

            const result = await this.pool.query(query, [movimentoId]);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar parcelas do movimento no banco', {
                error: error.message,
                movimentoId
            });
            throw new DatabaseError('Erro ao buscar parcelas do movimento', error);
        }
    }
}

module.exports = BoletoRepository;
