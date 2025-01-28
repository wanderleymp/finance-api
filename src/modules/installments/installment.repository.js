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
        logger.info('Repository: Iniciando buildWhereClause', { filters });

        const conditions = [];
        const params = [];
        let paramCount = 0;

        // Inicialização padronizada para todos os filtros
        const fullName = filters.full_name || filters.fullName || filters.search;
        const startDate = filters.start_date || filters.startDate;
        const endDate = filters.end_date || filters.endDate;

        logger.info('Repository: Filtros normalizados', { 
            fullName,
            startDate,
            endDate,
            originalFilters: filters
        });

        if (startDate && endDate) {
            const formattedStartDate = moment(startDate).startOf('day').format('YYYY-MM-DD');
            const formattedEndDate = moment(endDate).startOf('day').format('YYYY-MM-DD');
            
            conditions.push(`DATE(i.due_date) >= $${++paramCount} AND DATE(i.due_date) <= $${++paramCount}`);
            params.push(formattedStartDate, formattedEndDate);
            
            logger.info('Repository: Adicionado filtro de data', {
                startDate: formattedStartDate,
                endDate: formattedEndDate,
                paramCount
            });
        }

        if (fullName) {
            conditions.push(`p.full_name ILIKE $${++paramCount}`);
            params.push(`%${fullName}%`);
            
            logger.info('Repository: Adicionado filtro de nome', {
                fullName,
                paramCount
            });
        }

        if (filters.status) {
            conditions.push(`i.status = $${++paramCount}`);
            params.push(filters.status);
            
            logger.info('Repository: Adicionado filtro de status', {
                status: filters.status,
                paramCount
            });
        }

        if (filters.payment_id) {
            conditions.push(`i.payment_id = $${++paramCount}`);
            params.push(filters.payment_id);
            
            logger.info('Repository: Adicionando filtro de payment_id', {
                payment_id: filters.payment_id,
                paramCount
            });
        }

        if (filters.installment_number) {
            conditions.push(`i.installment_number = $${++paramCount}`);
            params.push(filters.installment_number);
            
            logger.info('Repository: Adicionando filtro de installment_number', {
                installment_number: filters.installment_number,
                paramCount
            });
        }

        if (filters.amount) {
            conditions.push(`i.amount = $${++paramCount}`);
            params.push(filters.amount);
            
            logger.info('Repository: Adicionando filtro de amount', {
                amount: filters.amount,
                paramCount
            });
        }

        logger.info('Repository: Resultado final buildWhereClause', {
            conditions,
            params,
            totalParams: paramCount
        });

        return { conditions, params };
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            logger.info('Repository: Parâmetros recebidos no findAll', { 
                page, 
                limit, 
                filters: JSON.stringify(filters)
            });

            const { conditions, params } = this.buildWhereClause(filters);

            const offset = (page - 1) * limit;

            const baseQuery = `
                SELECT 
                    i.installment_id,
                    i.payment_id,
                    i.installment_number,
                    i.due_date,
                    i.expected_date,
                    i.amount,
                    i.balance,
                    i.status,
                    p.full_name,
                    m.movement_id,
                    m.description as movement_description,
                    mp.total_amount as payment_total_amount,
                    mp.status as payment_status,
                    (SELECT COALESCE(json_agg(b.*) FILTER (WHERE b.installment_id IS NOT NULL), '[]'::json)
                     FROM boletos b
                     WHERE b.installment_id = i.installment_id 
                     AND b.status = 'A_RECEBER') as boletos
                FROM installments i
                JOIN movement_payments mp ON i.payment_id = mp.payment_id
                JOIN movements m ON mp.movement_id = m.movement_id
                JOIN persons p ON m.person_id = p.person_id
                WHERE m.movement_status_id = 2
                ${conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : ''}
            `;

            const countQuery = `
                SELECT COUNT(*) as total
                FROM installments i
                JOIN movement_payments mp ON i.payment_id = mp.payment_id
                JOIN movements m ON mp.movement_id = m.movement_id
                JOIN persons p ON m.person_id = p.person_id
                WHERE m.movement_status_id = 2
                ${conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : ''}
            `;

            const sortOrder = filters.order || 'DESC';
            const sortField = filters.sort || 'due_date';

            const finalQuery = `
                ${baseQuery}
                ORDER BY ${sortField} ${sortOrder}
                LIMIT $${params.length + 1} OFFSET $${params.length + 2}
            `;

            const finalQueryParams = [...params, limit, offset];

            logger.info('Repository: Detalhes da consulta SQL completa', {
                baseQuery,
                finalQuery,
                conditions: conditions.join(' AND '),
                params: finalQueryParams,
                order: sortOrder,
                sort: sortField,
                limit,
                offset
            });

            const [dataResult, countResult] = await Promise.all([
                this.pool.query(finalQuery, finalQueryParams),
                this.pool.query(countQuery, params)
            ]);

            const totalItems = parseInt(countResult.rows[0].total, 10);
            const totalPages = Math.ceil(totalItems / limit);

            logger.info('Repository: Resultado da consulta', {
                totalItems,
                totalPages,
                currentPage: page,
                itemsReturned: dataResult.rows.length
            });

            return {
                items: dataResult.rows,
                meta: {
                    currentPage: page,
                    itemCount: dataResult.rows.length,
                    itemsPerPage: limit,
                    totalItems,
                    totalPages
                },
                links: {
                    first: `/installments/details?page=1&limit=${limit}&sort=${sortField}&order=${sortOrder}`,
                    previous: page > 1 ? `/installments/details?page=${page - 1}&limit=${limit}&sort=${sortField}&order=${sortOrder}` : null,
                    next: page < totalPages ? `/installments/details?page=${page + 1}&limit=${limit}&sort=${sortField}&order=${sortOrder}` : null,
                    last: `/installments/details?page=${totalPages}&limit=${limit}&sort=${sortField}&order=${sortOrder}`
                }
            };
        } catch (error) {
            logger.error('Repository: Erro ao buscar parcelas', {
                error: error.message,
                stack: error.stack,
                filters
            });
            throw new DatabaseError('Erro ao buscar parcelas', error);
        }
    }

    async findAllWithDetails(page = 1, limit = 10, filters = {}) {
        try {
            logger.info('Repository: Iniciando busca de parcelas com detalhes', { 
                page, 
                limit, 
                filters 
            });

            const offset = (page - 1) * limit;
            const { sort = 'due_date', order = 'DESC', ...searchFilters } = filters;

            logger.info('Repository: Parâmetros de paginação e ordenação', {
                offset,
                sort,
                order,
                searchFilters
            });

            const baseQuery = `
                SELECT 
                    i.installment_id,
                    i.payment_id,
                    i.installment_number,
                    i.due_date,
                    i.expected_date,
                    i.amount,
                    i.balance,
                    i.status,
                    p.full_name,
                    m.movement_id,
                    m.description as movement_description,
                    mp.total_amount as payment_total_amount,
                    mp.status as payment_status,
                    (SELECT COALESCE(json_agg(b.*) FILTER (WHERE b.installment_id IS NOT NULL), '[]'::json)
                     FROM boletos b
                     WHERE m.movement_status_id = 2 AND b.installment_id = i.installment_id 
                     AND b.status = 'A_RECEBER') as boletos
                FROM installments i
                JOIN movement_payments mp ON i.payment_id = mp.payment_id
                JOIN movements m ON mp.movement_id = m.movement_id
                JOIN persons p ON m.person_id = p.person_id
                WHERE m.movement_status_id = 2
            `;

            const { conditions, params } = this.buildWhereClause(searchFilters);
            const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

            logger.info('Repository: Query construída', {
                baseQuery,
                whereClause,
                params
            });

            // Adiciona parâmetros de paginação
            params.push(limit, offset);

            const query = `${baseQuery} ${whereClause} ORDER BY i.${sort} ${order} LIMIT $${params.length - 1} OFFSET $${params.length}`;
            
            logger.info('Repository: Query completa para debug', {
                method: 'findAllWithDetails',
                query: query,
                params: params,
                baseQuery: baseQuery,
                whereClause: whereClause,
                paramCount: params.length
            });

            logger.info('Repository: Executando query final', {
                finalQuery: query,
                paramCount: params.length
            });

            const result = await this.pool.query(query, params);

            logger.info('Repository: Resultado da query', {
                rowCount: result.rowCount,
                success: true
            });

            return result.rows;
        } catch (error) {
            logger.error('Repository: Erro ao buscar parcelas com detalhes', {
                error: error.message,
                stack: error.stack
            });
            throw new DatabaseError('Erro ao buscar parcelas com detalhes', error);
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
            const { conditions, params } = this.buildWhereClause({ payment_id: paymentId });
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
                ${conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''}
                ORDER BY i.installment_number
            `;

            const { rows } = await this.pool.query(query, params);
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
            const { conditions, params } = this.buildWhereClause({ installment_id: installmentId });
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
                ${conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''}
            `;

            logger.info('Repository: Buscando pagamento por ID da parcela', { installmentId });

            const result = await this.pool.query(query, params);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Repository: Erro ao buscar pagamento por ID da parcela', {
                error: error.message,
                errorStack: error.stack,
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

    async getInstallmentById(installmentId) {
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

            const { rows } = await this.pool.query(query, [installmentId]);
            
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
