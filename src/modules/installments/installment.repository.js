const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');
const { DatabaseError } = require('../../utils/errors');
const PersonService = require('../persons/person.service');
const moment = require('moment-timezone');

class InstallmentRepository extends BaseRepository {
    constructor() {
        super('installments', 'installment_id');
        this.personService = new PersonService();
    }

    /**
     * Constrói a cláusula WHERE com base nos filtros
     * @private
     */
    buildWhereClause(filters = {}) {
        const conditions = [];
        const params = [];
        let paramCount = 0;

        // Filtros de data
        if (filters.start_date && filters.end_date) {
            const startDate = moment(filters.start_date).startOf('day').toISOString();
            const endDate = moment(filters.end_date).endOf('day').toISOString();
            
            conditions.push(`i.due_date BETWEEN $${++paramCount} AND $${++paramCount}`);
            params.push(startDate, endDate);
        }

        // Filtro por status
        if (filters.status) {
            conditions.push(`i.status = $${++paramCount}`);
            params.push(filters.status);
        }

        // Filtro por movimento (payment)
        if (filters.payment_id) {
            conditions.push(`i.payment_id = $${++paramCount}`);
            params.push(filters.payment_id);
        }

        // Filtro por número da parcela
        if (filters.installment_number) {
            conditions.push(`i.installment_number = $${++paramCount}`);
            params.push(filters.installment_number);
        }

        // Filtro por valor
        if (filters.amount) {
            conditions.push(`i.amount = $${++paramCount}`);
            params.push(filters.amount);
        }

        const whereClause = conditions.length > 0 
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        return { whereClause, params, paramCount };
    }

    /**
     * Lista todas as parcelas com filtros e paginação
     */
    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const { whereClause, params, paramCount } = this.buildWhereClause(filters);
            const offset = (page - 1) * limit;

            // Query principal com joins necessários
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
                    mp.movement_id,
                    m.description as movement_description,
                    m.movement_type_id as movement_type,
                    m.movement_status_id as movement_status,
                    p.full_name as person_name,
                    CASE 
                        WHEN $${paramCount + 3}::boolean = true THEN (
                            SELECT json_agg(b.*) 
                            FROM boletos b 
                            WHERE b.installment_id = i.installment_id
                        )
                        ELSE NULL
                    END as boletos
                FROM installments i
                LEFT JOIN movement_payments mp ON i.payment_id = mp.payment_id
                LEFT JOIN movements m ON mp.movement_id = m.movement_id
                LEFT JOIN persons p ON m.person_id = p.person_id
                ${whereClause}
                ORDER BY i.due_date DESC, i.installment_number
                LIMIT $${paramCount + 1}
                OFFSET $${paramCount + 2}
            `;

            // Query de contagem
            const countQuery = `
                SELECT COUNT(*)::integer as total
                FROM installments i
                LEFT JOIN movement_payments mp ON i.payment_id = mp.payment_id
                LEFT JOIN movements m ON mp.movement_id = m.movement_id
                ${whereClause}
            `;

            // Executa as queries
            const includeBoletos = filters.include === 'boletos';
            const [resultQuery, countResult] = await Promise.all([
                this.pool.query(query, [...params, limit, offset, includeBoletos]),
                this.pool.query(countQuery, params)
            ]);

            return {
                data: resultQuery.rows,
                total: parseInt(countResult.rows[0]?.total || 0),
                page: parseInt(page),
                limit: parseInt(limit)
            };
        } catch (error) {
            logger.error('Erro ao listar parcelas', {
                error: error.message,
                filters,
                stack: error.stack
            });
            throw new DatabaseError('Erro ao listar parcelas', error);
        }
    }

    /**
     * Busca parcelas de um movimento
     */
    async findByMovementId(movementId) {
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
                    m.movement_id,
                    m.description as movement_description,
                    m.movement_type_id as movement_type,
                    m.movement_status_id as movement_status
                FROM installments i
                JOIN movement_payments mp ON i.payment_id = mp.payment_id
                JOIN movements m ON mp.movement_id = m.movement_id
                WHERE m.movement_id = $1
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
                SELECT 
                    i.installment_id,
                    i.payment_id,
                    i.installment_number,
                    i.due_date,
                    i.amount,
                    i.balance,
                    i.status,
                    i.account_entry_id,
                    i.expected_date
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
                    account_entry_id,
                    expected_date
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;

            const result = await client.query(query, [
                data.payment_id,
                data.installment_number,
                data.due_date,
                data.amount,
                data.balance,
                data.status,
                data.account_entry_id,
                data.expected_date
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

            // Prepara os campos para atualização
            const updateFields = [];
            const queryParams = [];
            let paramIndex = 1;

            // Adiciona due_date se fornecido
            if (data.due_date) {
                updateFields.push(`due_date = $${paramIndex}`);
                queryParams.push(data.due_date);
                paramIndex++;
            }

            // Adiciona amount se fornecido
            if (data.amount !== undefined) {
                updateFields.push(`amount = $${paramIndex}`);
                queryParams.push(data.amount);
                paramIndex++;
            }

            // Adiciona o ID como último parâmetro
            queryParams.push(id);

            // Constrói a query dinamicamente
            const query = `
                UPDATE ${this.tableName}
                SET ${updateFields.join(', ')}
                WHERE ${this.primaryKey} = $${paramIndex}
                RETURNING *
            `;

            logger.debug('Update query', { 
                query, 
                params: queryParams,
                data 
            });

            const result = await client.query(query, queryParams);

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erro ao atualizar parcela', { 
                error: error.message, 
                data,
                id 
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async findPaymentByInstallmentId(installmentId) {
        try {
            const query = `
                SELECT 
                    p.payment_id,
                    p.movement_id,
                    m.description,
                    m.person_id
                FROM installments i
                JOIN movement_payments p ON i.payment_id = p.payment_id
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
                INSERT INTO ${this.tableName} (${columns.join(', ')})
                VALUES (${placeholders})
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
                SET ${setColumns}
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

    /**
     * Busca detalhes de uma parcela específica por ID
     * @param {number} id - ID da parcela
     * @returns {Promise<Object>} Detalhes da parcela
     */
    async findInstallmentWithDetails(id) {
        try {
            logger.info('Buscando detalhes da parcela', { 
                id, 
                method: 'findInstallmentWithDetails' 
            });

            const query = `
                SELECT 
                    p.full_name,
                    m.movement_id, 
                    m.movement_status_id,
                    i.installment_id,
                    i.payment_id,
                    i.account_entry_id,
                    i.installment_number,
                    i.due_date,
                    i.amount,
                    i.balance,
                    i.status,
                    i.expected_date,
                    b.boleto_id,
                    b.boleto_number,
                    b.boleto_url,
                    b.status as boleto_status,
                    b.generated_at as boleto_generated_at
                FROM installments i
                LEFT JOIN movement_payments mp ON i.payment_id = mp.payment_id
                LEFT JOIN movements m ON mp.movement_id = m.movement_id
                LEFT JOIN persons p ON m.person_id = p.person_id
                LEFT JOIN (
                    SELECT DISTINCT ON (installment_id)
                        installment_id, 
                        boleto_id,
                        boleto_number,
                        boleto_url,
                        status,
                        generated_at
                    FROM boletos
                    ORDER BY installment_id, boleto_id DESC
                ) b ON b.installment_id = i.installment_id
                WHERE i.installment_id = $1 AND m.movement_status_id = 2
            `;

            logger.info('Executando query de detalhes da parcela', { 
                query, 
                id 
            });

            const { rows } = await this.pool.query(query, [id]);
            
            logger.info('Resultado da busca de detalhes da parcela', { 
                rowCount: rows.length,
                firstRow: rows[0]
            });

            return rows[0] || null;
        } catch (error) {
            logger.error('Erro ao buscar detalhes da parcela', {
                error: error.message,
                errorStack: error.stack,
                id
            });
            throw new DatabaseError('Erro ao buscar detalhes da parcela', error);
        }
    }

    /**
     * Atualiza a data de vencimento de uma parcela
     * @param {number} installmentId - ID da parcela
     * @param {Date} newDueDate - Nova data de vencimento
     * @returns {Promise<Object>} Parcela atualizada
     */
    async updateDueDate(installmentId, newDueDate) {
        try {
            const query = `
                UPDATE installments 
                SET due_date = $1, 
                    updated_at = NOW()
                WHERE installment_id = $2 
                RETURNING *
            `;

            const { rows } = await this.pool.query(query, [newDueDate, installmentId]);

            if (rows.length === 0) {
                throw new DatabaseError('Parcela não encontrada');
            }

            logger.info('Vencimento da parcela atualizado', {
                installmentId,
                newDueDate
            });

            return rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar vencimento da parcela', {
                error: error.message,
                installmentId,
                newDueDate
            });
            throw new DatabaseError('Erro ao atualizar vencimento da parcela', error);
        }
    }
}

module.exports = InstallmentRepository;
