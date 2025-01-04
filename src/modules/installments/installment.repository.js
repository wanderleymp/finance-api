const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');
const { DatabaseError } = require('../../utils/errors');
const PersonService = require('../persons/person.service');

class InstallmentRepository extends BaseRepository {
    constructor() {
        super('installments', 'installment_id');
        this.personService = new PersonService();
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

    // Método removido, substituído por findAll com include=boletos
    // async findAllWithDetails(page = 1, limit = 10, filters = {}) {
    //     try {
    //         // Lógica anterior de busca com detalhes
    //     } catch (error) {
    //         throw error;
    //     }
    // }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            // Normaliza a página e o limite
            page = Math.max(1, Number(page));
            limit = Math.max(1, Number(limit));
            const offset = (page - 1) * limit;

            // Prepara os filtros
            const queryParams = [];
            let whereClause = '';
            let paramCount = 1;
            
            // Adiciona filtros de data se existirem
            if (filters.start_date) {
                queryParams.push(filters.start_date);
                whereClause += `${whereClause ? ' AND ' : ' WHERE '}i.due_date >= $${paramCount++}::date`;
            }
            
            if (filters.end_date) {
                queryParams.push(filters.end_date);
                whereClause += `${whereClause ? ' AND ' : ' WHERE '}i.due_date <= $${paramCount++}::date`;
            }

            // Adiciona filtro de status
            let statusList = [];
            if (filters.status) {
                // Converte para array se não for
                statusList = Array.isArray(filters.status) 
                    ? filters.status 
                    : [filters.status];
                
                // Adiciona status como parâmetro
                queryParams.push(statusList);
                
                whereClause += `${whereClause ? ' AND ' : ' WHERE '}i.status = ANY($${paramCount++})`;
            }

            if (filters.account_entry_id) {
                queryParams.push(filters.account_entry_id);
                whereClause += `${whereClause ? ' AND ' : ' WHERE '}i.account_entry_id = $${paramCount++}`;
            }

            if (filters.full_name) {
                queryParams.push(`%${filters.full_name}%`);
                whereClause += `${whereClause ? ' AND ' : ' WHERE '}LOWER(p.full_name) LIKE LOWER($${paramCount++})`;
            }

            // Define orderBy
            const orderBy = filters.orderBy || 'due_date DESC, full_name ASC';

            // Adiciona parâmetros de paginação
            queryParams.push(limit, offset);

            // Log detalhado dos parâmetros
            logger.debug('Parâmetros da consulta de parcelas', { 
                filters, 
                whereClause, 
                queryParams,
                statusList
            });

            // Opções para personalizar a query
            const options = {
                orderBy,
                customQuery: `
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
                        i.expected_date
                        ${filters.include === 'boletos' ? `,
                            boletos.boleto_id,
                            boletos.boleto_number,
                            boletos.boleto_url,
                            boletos.status as boleto_status,
                            boletos.boleto_generated_at
                        ` : ''}
                    FROM installments i
                    JOIN movement_payments mp ON i.payment_id = mp.payment_id
                    JOIN movements m ON mp.movement_id = m.movement_id
                    JOIN persons p ON m.person_id = p.person_id
                    ${filters.include === 'boletos' ? `
                        LEFT JOIN (
                            SELECT DISTINCT ON (installment_id)
                                installment_id, 
                                boleto_id,
                                boleto_number,
                                boleto_url,
                                status,
                                generated_at as boleto_generated_at
                            FROM boletos
                            ORDER BY installment_id, boleto_id DESC
                        ) boletos ON boletos.installment_id = i.installment_id` : ''}
                    ${whereClause ? whereClause + ' AND m.movement_status_id = 2' : 'WHERE m.movement_status_id = 2'}
                    ORDER BY ${orderBy}
                    LIMIT $${paramCount} OFFSET $${paramCount + 1}
                `,
                queryParams,
                countQuery: `
                    SELECT COUNT(*) as total
                    FROM (
                        SELECT DISTINCT i.installment_id
                        FROM installments i
                        JOIN movement_payments mp ON i.payment_id = mp.payment_id
                        JOIN movements m ON m.movement_id = mp.movement_id
                        JOIN persons p ON p.person_id = m.person_id
                        ${filters.include === 'boletos' ? `
                            LEFT JOIN (
                                SELECT DISTINCT ON (installment_id)
                                    installment_id, 
                                    boleto_id,
                                    boleto_number,
                                    boleto_url,
                                    status,
                                    generated_at as boleto_generated_at
                                FROM boletos
                                ORDER BY installment_id, boleto_id DESC
                            ) boletos ON boletos.installment_id = i.installment_id` : ''}
                        ${whereClause ? whereClause + ' AND m.movement_status_id = 2' : 'WHERE m.movement_status_id = 2'}
                    ) as subquery
                `
            };

            // Usa o método findAll do BaseRepository
            const result = await super.findAll(page, limit, filters, options);

            // Log para verificar o full_name e garantir sua inclusão na query
            logger.debug('Resultado da busca de parcelas', {
                itemCount: result.items.length,
                firstItem: result.items[0],
                full_name: result.items[0]?.full_name,
                status: result.items.map(item => item.status)
            });

            // Se incluir boletos, agrupa os boletos por parcela
            if (filters.include === 'boletos') {
                // Agrupa boletos por installment_id
                const boletosMap = {};
                result.items.forEach(row => {
                    if (row.boleto_id) {
                        if (!boletosMap[row.installment_id]) {
                            boletosMap[row.installment_id] = [];
                        }
                        boletosMap[row.installment_id].push({
                            boleto_id: row.boleto_id,
                            boleto_number: row.boleto_number,
                            boleto_url: row.boleto_url,
                            status: row.boleto_status,
                            generated_at: row.boleto_generated_at
                        });
                    }
                });

                // Adiciona boletos aos itens
                result.items = result.items.map(item => {
                    const installmentWithBoletos = { ...item };
                    installmentWithBoletos.boletos = boletosMap[item.installment_id] || [];
                    delete installmentWithBoletos.boleto_id;
                    delete installmentWithBoletos.boleto_number;
                    delete installmentWithBoletos.boleto_url;
                    delete installmentWithBoletos.boleto_status;
                    delete installmentWithBoletos.boleto_generated_at;
                    return installmentWithBoletos;
                });
            }

            return result;
        } catch (error) {
            logger.error('Erro ao buscar parcelas', { 
                error: error.message, 
                filters,
                stack: error.stack
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
                JOIN movement_payments mp ON i.payment_id = mp.payment_id
                JOIN movements m ON mp.movement_id = m.movement_id
                JOIN persons p ON m.person_id = p.person_id
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
