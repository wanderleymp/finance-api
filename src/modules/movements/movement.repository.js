const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');
const { DatabaseError } = require('../../utils/errors');

class MovementRepository extends BaseRepository {
    constructor() {
        super('movements', 'movement_id');
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            // Extrair filtros especiais
            const { 
                orderBy = 'movement_date', 
                orderDirection = 'DESC', 
                startDate, 
                endDate,
                include,
                search,
                ...otherFilters 
            } = filters;

            // Mapeamento de campos de ordenação
            const orderByMapping = {
                'date': 'movement_date',
                'id': 'movement_id',
                'type': 'movement_type_id',
                'status': 'movement_status_id'
            };

            // Mapear o campo de ordenação
            const mappedOrderBy = orderByMapping[orderBy] || orderBy;

            // Construir cláusula WHERE para filtros de data
            const whereConditions = [];
            const queryParams = [];

            // Filtro de data
            if (startDate && endDate) {
                whereConditions.push(`m.movement_date BETWEEN $1 AND $2`);
                queryParams.push(startDate, endDate);
            }

            // Filtro de busca textual
            if (search) {
                const searchTerm = `%${search}%`;
                whereConditions.push(`(
                    m.description ILIKE $${queryParams.length + 1} OR 
                    p.full_name ILIKE $${queryParams.length + 2}
                )`);
                queryParams.push(searchTerm, searchTerm);
            }

            // Construir cláusula WHERE
            const whereClause = whereConditions.length > 0 
                ? `WHERE ${whereConditions.join(' AND ')}` 
                : '';

            // Query personalizada com joins e alias definido
            const customQuery = `
                SELECT 
                    m.movement_id,
                    m.movement_type_id,
                    m.movement_status_id,
                    m.person_id,
                    m.movement_date,
                    m.description,
                    m.created_at,
                    COALESCE(SUM(mp.total_amount), 0) as total_amount,
                    ms.status_name,
                    mt.type_name,
                    p.full_name as person_name
                FROM movements m
                LEFT JOIN movement_statuses ms ON m.movement_status_id = ms.movement_status_id
                LEFT JOIN movement_types mt ON m.movement_type_id = mt.movement_type_id
                LEFT JOIN persons p ON m.person_id = p.person_id
                LEFT JOIN movement_payments mp ON m.movement_id = mp.movement_id
                ${whereClause}
                GROUP BY 
                    m.movement_id, 
                    ms.status_name, 
                    mt.type_name, 
                    p.full_name
                ORDER BY m.${mappedOrderBy} ${orderDirection}
            `;

            // Query de contagem com os mesmos joins
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM movements m
                LEFT JOIN movement_statuses ms ON m.movement_status_id = ms.movement_status_id
                LEFT JOIN movement_types mt ON m.movement_type_id = mt.movement_type_id
                LEFT JOIN persons p ON m.person_id = p.person_id
                ${whereClause}
            `;

            // Usa o método findAll do BaseRepository com query personalizada
            const result = await super.findAll(page, limit, {}, {
                customQuery,
                countQuery,
                queryParams
            });

            // Processamento adicional para includes, se necessário
            let processedItems = result.data;
            if (include) {
                const includeOptions = include.split('.');
                
                // Lógica para processamento de includes
                if (includeOptions.includes('payments')) {
                    const movementIds = result.data.map(m => m.movement_id);
                    const payments = await this.findPaymentsByMovementIds(movementIds);
                    
                    processedItems = result.data.map(movement => ({
                        ...movement,
                        payments: payments.filter(p => p.movement_id === movement.movement_id)
                    }));

                    // Se incluir installments
                    if (includeOptions.includes('installments')) {
                        const paymentIds = payments.map(p => p.payment_id);
                        logger.debug('Buscando installments', { paymentIds });
                        const installments = await this.findInstallmentsByPaymentIds(paymentIds);
                        logger.debug('Installments encontrados', { count: installments.length, installments });

                        processedItems = processedItems.map(movement => ({
                            ...movement,
                            payments: movement.payments.map(payment => ({
                                ...payment,
                                installments: installments.filter(i => i.payment_id === payment.payment_id)
                            }))
                        }));

                        // Se incluir boletos
                        if (includeOptions.includes('boletos')) {
                            const installmentIds = installments.map(i => i.installment_id);
                            const boletos = await this.findBoletosByInstallmentIds(installmentIds);

                            processedItems = processedItems.map(movement => ({
                                ...movement,
                                payments: movement.payments.map(payment => ({
                                    ...payment,
                                    installments: payment.installments.map(installment => ({
                                        ...installment,
                                        boletos: boletos.filter(b => b.installment_id === installment.installment_id)
                                    }))
                                }))
                            }));
                        }
                    }
                }
            }

            return {
                items: processedItems,
                meta: {
                    total: result.total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(result.total / limit)
                }
            };
        } catch (error) {
            logger.error('Repository: Erro ao buscar movimentos', {
                error: error.message,
                filters,
                stack: error.stack
            });
            throw new DatabaseError('Erro ao buscar movimentos', error);
        }
    }

    async findById(id, detailed = false) {
        try {
            logger.info('Repository: Buscando movimento por ID', { id, detailed });

            let query;
            if (detailed) {
                query = `
                    SELECT 
                        m.*,
                        mt.type_name,
                        ms.status_name,
                        p.full_name as person_name,
                        p.document_number as person_document,
                        p.email as person_email
                    FROM movements m
                    LEFT JOIN movement_types mt ON mt.movement_type_id = m.movement_type_id
                    LEFT JOIN movement_statuses ms ON ms.movement_status_id = m.movement_status_id
                    LEFT JOIN persons p ON p.person_id = m.person_id
                    WHERE m.movement_id = $1
                `;
            } else {
                query = `
                    SELECT 
                        m.movement_id,
                        m.movement_type_id,
                        m.movement_status_id,
                        m.person_id,
                        m.movement_date,
                        m.description,
                        m.created_at
                    FROM movements m
                    WHERE m.movement_id = $1
                `;
            }

            logger.info('Repository: Executando query', { 
                query, 
                id, 
                queryParams: [id] 
            });

            const { rows, rowCount } = await this.pool.query(query, [id]);

            logger.info('Repository: Resultado da busca', { 
                rowCount, 
                hasRows: rows.length > 0 
            });

            if (rowCount === 0) {
                return null;
            }

            return rows[0];
        } catch (error) {
            logger.error('Repository: Erro ao buscar movimento por ID', {
                error: error.message,
                error_stack: error.stack,
                id
            });
            throw error;
        }
    }

    async createWithClient(client, data) {
        try {
            logger.info('Repository: Criando movimento com cliente de transação', { data });

            const columns = Object.keys(data);
            const values = Object.values(data);
            const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

            const query = `
                INSERT INTO ${this.tableName} (${columns.join(', ')})
                VALUES (${placeholders})
                RETURNING *
            `;

            const result = await client.query(query, values);
            
            logger.info('Repository: Movimento criado com sucesso', { 
                movement_id: result.rows[0].movement_id 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Repository: Erro ao criar movimento', {
                error: error.message,
                data,
                tableName: this.tableName
            });
            throw new DatabaseError('Erro ao criar movimento', error);
        }
    }

    async updateWithClient(client, id, data) {
        try {
            logger.info('Repository: Atualizando movimento com cliente de transação', { 
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
                throw new DatabaseError(`Movimento com ID ${id} não encontrado`);
            }

            logger.info('Repository: Movimento atualizado com sucesso', { 
                movement_id: result.rows[0].movement_id 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Repository: Erro ao atualizar movimento', {
                error: error.message,
                id,
                data,
                tableName: this.tableName
            });
            throw new DatabaseError('Erro ao atualizar movimento', error);
        }
    }

    async deleteWithClient(client, id) {
        try {
            logger.info('Repository: Removendo movimento com cliente de transação', { id });

            const query = `
                DELETE FROM ${this.tableName}
                WHERE ${this.primaryKey} = $1
                RETURNING *
            `;

            const result = await client.query(query, [id]);
            
            if (result.rows.length === 0) {
                throw new DatabaseError(`Movimento com ID ${id} não encontrado`);
            }

            logger.info('Repository: Movimento removido com sucesso', { 
                movement_id: result.rows[0].movement_id 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Repository: Erro ao remover movimento', {
                error: error.message,
                id,
                tableName: this.tableName
            });
            throw new DatabaseError('Erro ao remover movimento', error);
        }
    }

    getWhereClause(filters) {
        const conditions = Object.keys(filters)
            .map((key, index) => `${key} = $${index + 1}`)
            .join(' AND ');

        return conditions ? `WHERE ${conditions}` : '';
    }

    // Métodos auxiliares para busca de dados relacionados
    async findPaymentsByMovementIds(movementIds) {
        try {
            const query = `
                SELECT * FROM movement_payments 
                WHERE movement_id = ANY($1)
            `;
            const result = await this.pool.query(query, [movementIds]);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar pagamentos', { error: error.message });
            return [];
        }
    }

    async findInstallmentsByPaymentIds(paymentIds) {
        try {
            const query = `
                SELECT * FROM installments 
                WHERE payment_id = ANY($1)
            `;
            const result = await this.pool.query(query, [paymentIds]);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar parcelas', { error: error.message });
            return [];
        }
    }

    async findBoletosByInstallmentIds(installmentIds) {
        try {
            const query = `
                SELECT * FROM boletos 
                WHERE installment_id = ANY($1)
            `;
            const result = await this.pool.query(query, [installmentIds]);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar boletos', { error: error.message });
            return [];
        }
    }

    /**
     * Busca items de um movimento
     * @param {number} movementId - ID do movimento
     * @returns {Promise<Array>} Lista de items
     */
    async findItems(movementId) {
        try {
            logger.info('Repository: Buscando items do movimento', { movementId });

            const query = `
                SELECT 
                    mi.*,
                    i.description as item_description,
                    i.code as item_code
                FROM movement_items mi
                LEFT JOIN items i ON i.item_id = mi.item_id
                WHERE mi.movement_id = $1
                ORDER BY mi.created_at DESC
            `;

            const result = await this.pool.query(query, [movementId]);
            
            logger.info('Repository: Items encontrados', { 
                movementId,
                count: result.rows.length
            });

            return result.rows;
        } catch (error) {
            logger.error('Repository: Erro ao buscar items do movimento', {
                error: error.message,
                movementId
            });
            // Se a tabela não existir, retorna array vazio
            if (error.code === '42P01') {
                logger.warn('Repository: Tabela movement_items não existe', { movementId });
                return [];
            }
            throw error;
        }
    }
}

module.exports = MovementRepository;
