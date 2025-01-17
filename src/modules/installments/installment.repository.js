const { logger } = require('../../middlewares/logger');
const { DatabaseError } = require('../../utils/errors');
const PersonService = require('../persons/person.service');
const moment = require('moment-timezone');
const { systemDatabase } = require('../../config/database');

class InstallmentRepository {
    constructor() {
        this.pool = systemDatabase.pool;
        this.tableName = 'installments';
        this.primaryKey = 'installment_id';
        this.personService = new PersonService();
    }

    buildWhereClause(filters = {}) {
        const conditions = [];
        const params = [];
        let paramCount = 0;

        // Normaliza o filtro de nome para full_name
        const fullName = filters.full_name || filters.fullName;
        
        // Normaliza filtros de data
        const startDate = filters.start_date || filters.startDate;
        const endDate = filters.end_date || filters.endDate;

        if (startDate && endDate) {
            const formattedStartDate = moment(startDate).startOf('day').toISOString();
            const formattedEndDate = moment(endDate).endOf('day').toISOString();
            conditions.push(`i.due_date BETWEEN $${++paramCount} AND $${++paramCount}`);
            params.push(formattedStartDate, formattedEndDate);
        }

        if (filters.status) {
            conditions.push(`i.status = $${++paramCount}`);
            params.push(filters.status);
        }

        if (filters.payment_id) {
            conditions.push(`i.payment_id = $${++paramCount}`);
            params.push(filters.payment_id);
        }

        if (filters.installment_number) {
            conditions.push(`i.installment_number = $${++paramCount}`);
            params.push(filters.installment_number);
        }

        if (filters.amount) {
            conditions.push(`i.amount = $${++paramCount}`);
            params.push(filters.amount);
        }

        if (fullName) {
            conditions.push(`p.full_name ILIKE $${++paramCount}`);
            params.push(`%${fullName}%`);
        }

        const whereClause = conditions.length > 0 
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        return { whereClause, queryParams: params, paramCount };
    }

    async listInstallments(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        
        // Mapeamento de campos de ordenação
        const sortMapping = {
            'due_date': 'i.due_date',
            'amount': 'i.amount',
            'status': 'i.status',
            'payment_id': 'i.payment_id'
        };

        // Definir campo de ordenação padrão
        const sortField = filters.sort ? sortMapping[filters.sort] || 'i.due_date' : 'i.due_date';
        const sortOrder = filters.order || 'desc';

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
                COUNT(*) OVER() as total_count
            FROM public.installments i
            JOIN payments p ON i.payment_id = p.payment_id
            WHERE 1=1
        `;

        const queryParams = [];
        let paramIndex = 1;

        // Adicionar filtros
        if (filters.status) {
            query += ` AND i.status = $${paramIndex}`;
            queryParams.push(filters.status);
            paramIndex++;
        }

        if (filters.payment_id) {
            query += ` AND i.payment_id = $${paramIndex}`;
            queryParams.push(filters.payment_id);
            paramIndex++;
        }

        // Filtros de data
        const startDate = filters.start_date || filters.startDate;
        const endDate = filters.end_date || filters.endDate;

        if (startDate) {
            query += ` AND i.due_date >= $${paramIndex}`;
            queryParams.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            query += ` AND i.due_date <= $${paramIndex}`;
            queryParams.push(endDate);
            paramIndex++;
        }

        // Adicionar ordenação
        query += ` ORDER BY ${sortField} ${sortOrder}`;

        // Adicionar paginação
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        try {
            const result = await this.pool.query(query, queryParams);

            const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
            const totalPages = Math.ceil(totalCount / limit);

            return {
                items: result.rows.map(row => {
                    delete row.total_count;
                    return row;
                }),
                meta: {
                    totalItems: totalCount,
                    itemCount: result.rows.length,
                    itemsPerPage: limit,
                    totalPages: totalPages,
                    currentPage: page
                },
                links: {
                    first: `?page=1&limit=${limit}`,
                    previous: page > 1 ? `?page=${page - 1}&limit=${limit}` : null,
                    next: page < totalPages ? `?page=${page + 1}&limit=${limit}` : null,
                    last: `?page=${totalPages}&limit=${limit}`
                }
            };
        } catch (error) {
            this.logger.error('Erro ao listar installments', { 
                error: error.message, 
                stack: error.stack,
                filters,
                page,
                limit 
            });
            throw error;
        }
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const includeBoletos = filters.include === 'boletos';
            const { whereClause, queryParams } = this.buildWhereClause(filters);
            
            // Log de depuração
            logger.info('Filtros de parcelas', { 
                filters, 
                whereClause, 
                queryParams 
            });
            
            // Calculamos o offset aqui para garantir que está correto
            const parsedPage = parseInt(page) || 1;
            const parsedLimit = parseInt(limit) || 10;
            const offset = (parsedPage - 1) * parsedLimit;
            
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
                    p.full_name,
                    p.full_name as person_name,
                    CASE 
                        WHEN $${queryParams.length + 1} = true THEN (
                            SELECT json_agg(b.*)
                            FROM boletos b
                            WHERE b.installment_id = i.installment_id AND b.status = 'A_RECEBER'
                        )
                        ELSE NULL
                    END as boletos
                FROM installments i
                LEFT JOIN movement_payments mp ON i.payment_id = mp.payment_id
                LEFT JOIN movements m ON mp.movement_id = m.movement_id
                LEFT JOIN persons p ON m.person_id = p.person_id
                ${whereClause ? whereClause + ' AND ' : 'WHERE '}m.movement_status_id = 2 AND m.is_template = false
                ORDER BY i.due_date DESC, i.installment_number
                LIMIT $${queryParams.length + 2} OFFSET $${queryParams.length + 3}
            `;

            const countQuery = `
                SELECT COUNT(*)::integer as total
                FROM installments i
                LEFT JOIN movement_payments mp ON i.payment_id = mp.payment_id
                LEFT JOIN movements m ON mp.movement_id = m.movement_id
                LEFT JOIN persons p ON m.person_id = p.person_id
                ${whereClause ? whereClause + ' AND ' : 'WHERE '}m.movement_status_id = 2 AND m.is_template = false
            `;

            const fullQueryParams = [...queryParams, includeBoletos, parsedLimit, offset];

            // Executa as queries
            const [dataResult, countResult] = await Promise.all([
                this.pool.query(query, fullQueryParams),
                this.pool.query(countQuery, queryParams)
            ]);

            return {
                data: dataResult.rows,
                total: parseInt(countResult.rows[0]?.total || 0),
                page: parsedPage,
                limit: parsedLimit
            };
            
        } catch (error) {
            logger.error('Erro ao listar parcelas', {
                error: error.message,
                filters,
                stack: error.stack
            });
            throw new DatabaseError('Erro ao listar parcelas');
        }
    }

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
                    i.expected_date
                FROM installments i
                JOIN movement_payments mp ON i.payment_id = mp.payment_id
                WHERE mp.movement_id = $1
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

    async findByPaymentId(paymentId) {
        try {
            const { whereClause, queryParams } = this.buildWhereClause({ payment_id: paymentId });
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
                ${whereClause}
                ORDER BY i.installment_number
            `;

            const { rows } = await this.pool.query(query, queryParams);
            return rows;
        } catch (error) {
            logger.error('Erro ao buscar parcelas do pagamento', {
                error: error.message,
                paymentId
            });
            throw new DatabaseError('Erro ao buscar parcelas do pagamento', error);
        }
    }

    async findByPaymentId(paymentId) {
        try {
            logger.info('Repository: Buscando parcelas por payment ID', { paymentId });

            const query = `
                SELECT 
                    i.*,
                    ae.status as entry_status,
                    ae.amount as entry_amount,
                    ae.entry_date
                FROM ${this.tableName} i
                LEFT JOIN account_entries ae ON ae.entry_id = i.account_entry_id
                WHERE i.payment_id = $1
                ORDER BY i.installment_number ASC
            `;

            const result = await this.pool.query(query, [paymentId]);
            
            logger.info('Repository: Parcelas encontradas', { 
                paymentId,
                count: result.rows.length
            });

            return result.rows;
        } catch (error) {
            logger.error('Repository: Erro ao buscar parcelas por payment ID', {
                error: error.message,
                paymentId
            });
            // Se a tabela não existir, retorna array vazio
            if (error.code === '42P01') {
                logger.warn('Repository: Tabela installments não existe', { paymentId });
                return [];
            }
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
            const { whereClause, queryParams } = this.buildWhereClause({ installment_id: installmentId });
            const query = `
                SELECT 
                    p.payment_id,
                    p.movement_id,
                    m.description,
                    m.person_id
                FROM installments i
                JOIN movement_payments p ON i.payment_id = p.payment_id
                JOIN movements m ON m.movement_id = p.movement_id
                LEFT JOIN persons p ON m.person_id = p.person_id
                ${whereClause}
            `;

            logger.info('Repository: Buscando pagamento por ID da parcela', { installmentId });

            const result = await this.pool.query(query, queryParams);

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
                    WHERE status = 'A_RECEBER'
                    ORDER BY installment_id, boleto_id DESC
                ) b ON b.installment_id = i.installment_id
                WHERE i.installment_id = $1 
                AND m.movement_status_id = 2
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

    async getInstallmentById(installmentId) {
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
                    mp.movement_id,
                    m.description as movement_description,
                    m.movement_type_id as movement_type,
                    m.movement_status_id as movement_status,
                    p.full_name,
                    p.full_name as person_name,
                    (
                        SELECT json_agg(b.*)
                        FROM boletos b
                        WHERE b.installment_id = i.installment_id AND b.status = 'A_RECEBER'
                    ) as boletos
                FROM installments i
                LEFT JOIN movement_payments mp ON i.payment_id = mp.payment_id
                LEFT JOIN movements m ON mp.movement_id = m.movement_id
                LEFT JOIN persons p ON m.person_id = p.person_id
                WHERE i.installment_id = $1
            `;

            const result = await this.pool.query(query, [installmentId]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar parcela por ID', {
                error: error.message,
                installmentId,
                stack: error.stack
            });
            throw new DatabaseError('Erro ao buscar parcela por ID');
        }
    }
}

module.exports = InstallmentRepository;
