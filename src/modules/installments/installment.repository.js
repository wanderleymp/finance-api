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
            throw new DatabaseError('Erro ao buscar parcelas do movimento', error);
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
            throw new DatabaseError('Erro ao buscar parcelas do pagamento', error);
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
            throw new DatabaseError('Erro ao buscar parcelas', error);
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

    async findPaymentByInstallmentId(installmentId) {
        try {
            const query = `
                SELECT 
                    p.*,
                    m.description,
                    m.person_id
                FROM installments i
                JOIN movement_payments p ON p.payment_id = i.payment_id
                JOIN movements m ON m.movement_id = p.movement_id
                WHERE i.installment_id = $1
            `;

            logger.info('Repository: Buscando pagamento por ID da parcela', { installmentId });

            const result = await this.pool.query(query, [installmentId]);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Repository: Erro ao buscar pagamento por ID da parcela', {
                error: error.message,
                error_stack: error.stack,
                installmentId
            });
            throw error;
        }
    }

    /**
     * Cria uma parcela com cliente de transação
     * @param {Object} client - Cliente de transação
     * @param {Object} data - Dados da parcela
     * @returns {Promise<Object>} Parcela criada
     */
    async createWithClient(client, data) {
        try {
            logger.info('Repository: Criando parcela com cliente de transação', { data });

            const columns = Object.keys(data);
            const values = Object.values(data);
            const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

            const query = `
                INSERT INTO ${this.tableName} (${columns.join(', ')}, created_at)
                VALUES (${placeholders}, NOW())
                RETURNING *
            `;

            const result = await client.query(query, values);
            
            logger.info('Repository: Parcela criada com sucesso', { 
                installment_id: result.rows[0].installment_id 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Repository: Erro ao criar parcela', {
                error: error.message,
                data,
                tableName: this.tableName
            });
            throw new DatabaseError('Erro ao criar parcela', error);
        }
    }

    /**
     * Atualiza parcela com cliente de transação
     * @param {Object} client - Cliente de transação
     * @param {number} id - ID da parcela
     * @param {Object} data - Dados para atualização
     * @returns {Promise<Object>} Parcela atualizada
     */
    async updateWithClient(client, id, data) {
        try {
            logger.info('Repository: Atualizando parcela com cliente de transação', { 
                id, 
                data 
            });

            const setColumns = Object.keys(data)
                .map((key, index) => `${key} = $${index + 2}`)
                .join(', ');

            const query = `
                UPDATE ${this.tableName}
                SET ${setColumns}, updated_at = NOW()
                WHERE ${this.primaryKey} = $1
                RETURNING *
            `;

            const values = [id, ...Object.values(data)];

            const result = await client.query(query, values);
            
            if (result.rows.length === 0) {
                throw new DatabaseError(`Parcela com ID ${id} não encontrada`);
            }

            logger.info('Repository: Parcela atualizada com sucesso', { 
                installment_id: result.rows[0].installment_id 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Repository: Erro ao atualizar parcela', {
                error: error.message,
                id,
                data,
                tableName: this.tableName
            });
            throw new DatabaseError('Erro ao atualizar parcela', error);
        }
    }

    /**
     * Remove parcela com cliente de transação
     * @param {Object} client - Cliente de transação
     * @param {number} id - ID da parcela
     * @returns {Promise<Object>} Parcela removida
     */
    async deleteWithClient(client, id) {
        try {
            logger.info('Repository: Removendo parcela com cliente de transação', { id });

            const query = `
                DELETE FROM ${this.tableName}
                WHERE ${this.primaryKey} = $1
                RETURNING *
            `;

            const result = await client.query(query, [id]);
            
            if (result.rows.length === 0) {
                throw new DatabaseError(`Parcela com ID ${id} não encontrada`);
            }

            logger.info('Repository: Parcela removida com sucesso', { 
                installment_id: result.rows[0].installment_id 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Repository: Erro ao remover parcela', {
                error: error.message,
                id,
                tableName: this.tableName
            });
            throw new DatabaseError('Erro ao remover parcela', error);
        }
    }
}

module.exports = InstallmentRepository;
