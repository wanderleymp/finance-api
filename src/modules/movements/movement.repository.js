const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');
const { DatabaseError } = require('../../utils/errors');
const MovementDetailedDTO = require('./dto/movement-detailed.dto');

class MovementRepository extends BaseRepository {
    constructor() {
        super('movements', 'movement_id');
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            // Log dos parâmetros recebidos
            logger.info('Parâmetros recebidos', { 
                page, 
                limit, 
                filters: JSON.stringify(filters)
            });

            // Configurar ordenação padrão
            const orderBy = filters.orderBy || 'movement_date';
            const orderDirection = filters.orderDirection || 'DESC';

            // Log das configurações de ordenação
            logger.info('Configurações de ordenação', {
                orderBy,
                orderDirection
            });

            // Mapeamento de campos
            const mappedOrderBy = this.mapOrderByField(orderBy);
            logger.info('Mapeamento de campos', {
                mappedOrderBy
            });

            // Construir cláusula WHERE
            const { whereClause, queryParams: whereParams } = this.buildWhereClause(filters);

            // Query para contagem total
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM movements m
                LEFT JOIN persons p ON m.person_id = p.person_id
                ${whereClause}
            `;

            // Log da query de contagem
            logger.info('Consulta SQL - Count', {
                countQuery,
                whereClause,
                queryParams: whereParams
            });

            // Query principal com todos os relacionamentos
            const customQuery = `
                WITH movement_data AS (
                    SELECT 
                        m.*,
                        p.full_name,
                        ms.status_name,
                        mt.type_name,
                        ROW_NUMBER() OVER (
                            ORDER BY 
                                m.movement_date DESC,
                                m.movement_id DESC
                        ) as row_num
                    FROM movements m
                    LEFT JOIN persons p ON m.person_id = p.person_id
                    LEFT JOIN movement_statuses ms ON m.movement_status_id = ms.movement_status_id
                    LEFT JOIN movement_types mt ON m.movement_type_id = mt.movement_type_id
                    ${whereClause}
                ),
                payments_data AS (
                    SELECT 
                        mp.movement_id,
                        jsonb_agg(
                            jsonb_build_object(
                                'payment_id', mp.payment_id,
                                'payment_method_id', mp.payment_method_id,
                                'total_amount', mp.total_amount,
                                'status', mp.status
                            )
                        ) AS payments
                    FROM movement_payments mp
                    GROUP BY mp.movement_id
                ),
                installments_data AS (
                    SELECT 
                        mp.movement_id,
                        i.installment_id,
                        jsonb_agg(
                            jsonb_build_object(
                                'installment_id', i.installment_id,
                                'installment_number', i.installment_number,
                                'due_date', i.due_date,
                                'amount', i.amount,
                                'balance', i.balance,
                                'status', i.status
                            )
                        ) AS installments
                    FROM movement_payments mp
                    JOIN installments i ON mp.payment_id = i.payment_id
                    GROUP BY mp.movement_id, i.installment_id
                ),
                boletos_data AS (
                    SELECT 
                        i.installment_id,
                        jsonb_agg(
                            jsonb_build_object(
                                'boleto_id', b.boleto_id,
                                'status', b.status,
                                'generated_at', b.generated_at,
                                'boleto_url', b.boleto_url
                            )
                        ) AS boletos
                    FROM installments i
                    LEFT JOIN boletos b ON i.installment_id = b.installment_id
                    GROUP BY i.installment_id
                ),
                invoices_data AS (
                    SELECT 
                        movement_id,
                        jsonb_agg(
                            jsonb_build_object(
                                'invoice_id', inv.invoice_id,
                                'number', inv.number,
                                'total_amount', inv.total_amount,
                                'status', inv.status,
                                'pdf_url', inv.pdf_url,
                                'xml_url', inv.xml_url
                            )
                        ) AS invoices
                    FROM invoices inv
                    GROUP BY movement_id
                )
                SELECT 
                    md.*,
                    COALESCE(pd.payments, '[]'::jsonb) AS payments,
                    COALESCE(id.installments, '[]'::jsonb) AS installments,
                    COALESCE(bd.boletos, '[]'::jsonb) AS boletos,
                    COALESCE(iv.invoices, '[]'::jsonb) AS invoices
                FROM movement_data md
                LEFT JOIN payments_data pd ON md.movement_id = pd.movement_id
                LEFT JOIN installments_data id ON md.movement_id = id.movement_id
                LEFT JOIN boletos_data bd ON id.installment_id = bd.installment_id
                LEFT JOIN invoices_data iv ON md.movement_id = iv.movement_id
                WHERE md.row_num BETWEEN ($${whereParams.length + 1} - 1) * $${whereParams.length + 2} + 1 
                    AND ($${whereParams.length + 1} * $${whereParams.length + 2})
                ORDER BY md.movement_date DESC, md.movement_id DESC
            `;

            // Parâmetros para a query principal
            const queryParams = [...whereParams, page, limit];

            // Log da query principal
            logger.info('Consulta SQL - Movimentos', {
                customQuery,
                whereClause,
                orderBy,
                orderDirection,
                page,
                limit,
                queryParams
            });

            // Executar consultas
            const [countResult, movementsResult] = await Promise.all([
                this.pool.query(countQuery, whereParams),
                this.pool.query(customQuery, queryParams)
            ]);

            const totalItems = parseInt(countResult.rows[0].total, 10);
            const totalPages = Math.ceil(totalItems / limit);

            // Log detalhado dos resultados
            logger.info('Resultado da consulta', {
                totalItems,
                totalPages,
                currentPage: page,
                itemsPerPage: limit,
                movementsFound: movementsResult.rows.length
            });

            // Log detalhado dos movimentos
            logger.info('Detalhes dos movimentos', {
                movements: movementsResult.rows.map(movement => ({
                    movement_id: movement.movement_id,
                    description: movement.description,
                    total_amount: movement.total_amount,
                    full_name: movement.full_name,
                    status_name: movement.status_name,
                    type_name: movement.type_name,
                    payments: movement.payments?.length || 0,
                    installments: movement.installments?.length || 0,
                    boletos: movement.boletos?.length || 0,
                    invoices: movement.invoices?.length || 0
                }))
            });

            // Log de diagnóstico de relacionamentos
            const relationshipStats = movementsResult.rows.reduce((stats, movement) => {
                stats.totalPayments += movement.payments?.length || 0;
                stats.totalInstallments += movement.installments?.length || 0;
                stats.totalBoletos += movement.boletos?.length || 0;
                stats.totalInvoices += movement.invoices?.length || 0;
                return stats;
            }, { totalPayments: 0, totalInstallments: 0, totalBoletos: 0, totalInvoices: 0 });

            logger.info('Estatísticas de relacionamentos', {
                ...relationshipStats,
                mediaPayments: relationshipStats.totalPayments / movementsResult.rows.length,
                mediaInstallments: relationshipStats.totalInstallments / movementsResult.rows.length,
                mediaBoletos: relationshipStats.totalBoletos / movementsResult.rows.length,
                mediaInvoices: relationshipStats.totalInvoices / movementsResult.rows.length
            });

            return {
                items: movementsResult.rows,
                meta: {
                    currentPage: page,
                    itemCount: movementsResult.rows.length,
                    itemsPerPage: limit,
                    totalItems,
                    totalPages
                },
                links: {
                    first: `/movements?page=1&limit=${limit}`,
                    previous: page > 1 ? `/movements?page=${page - 1}&limit=${limit}` : null,
                    next: page < totalPages ? `/movements?page=${page + 1}&limit=${limit}` : null,
                    last: `/movements?page=${totalPages}&limit=${limit}`
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar movimentos', { 
                error: error.message, 
                filters,
                stack: error.stack 
            });
            throw error;
        }
    }

    async findById(id, detailed = true) {
        try {
            logger.info('Buscando movimento por ID', { 
                movementId: id, 
                detailed 
            });

            const customQuery = `
                WITH movement_data AS (
                    SELECT 
                        m.*,
                        p.full_name,
                        ms.status_name,
                        mt.type_name
                    FROM movements m
                    LEFT JOIN persons p ON m.person_id = p.person_id
                    LEFT JOIN movement_statuses ms ON m.movement_status_id = ms.movement_status_id
                    LEFT JOIN movement_types mt ON m.movement_type_id = mt.movement_type_id
                    WHERE m.movement_id = $1
                ),
                payments_data AS (
                    SELECT 
                        mp.movement_id,
                        jsonb_agg(
                            jsonb_build_object(
                                'payment_id', mp.payment_id,
                                'payment_method_id', mp.payment_method_id,
                                'total_amount', mp.total_amount,
                                'status', mp.status
                            )
                        ) AS payments
                    FROM movement_payments mp
                    WHERE mp.movement_id = $1
                    GROUP BY mp.movement_id
                ),
                installments_data AS (
                    SELECT 
                        mp.movement_id,
                        i.installment_id,
                        jsonb_agg(
                            jsonb_build_object(
                                'installment_id', i.installment_id,
                                'installment_number', i.installment_number,
                                'due_date', i.due_date,
                                'amount', i.amount,
                                'balance', i.balance,
                                'status', i.status
                            )
                        ) AS installments
                    FROM movement_payments mp
                    JOIN installments i ON mp.payment_id = i.payment_id
                    WHERE mp.movement_id = $1
                    GROUP BY mp.movement_id, i.installment_id
                ),
                boletos_data AS (
                    SELECT 
                        i.installment_id,
                        jsonb_agg(
                            jsonb_build_object(
                                'boleto_id', b.boleto_id,
                                'status', b.status,
                                'generated_at', b.generated_at,
                                'boleto_url', b.boleto_url
                            )
                        ) AS boletos
                    FROM installments i
                    LEFT JOIN boletos b ON i.installment_id = b.installment_id
                    WHERE i.installment_id IN (
                        SELECT i2.installment_id 
                        FROM movement_payments mp2
                        JOIN installments i2 ON mp2.payment_id = i2.payment_id
                        WHERE mp2.movement_id = $1
                    )
                    GROUP BY i.installment_id
                ),
                invoices_data AS (
                    SELECT 
                        movement_id,
                        jsonb_agg(
                            jsonb_build_object(
                                'invoice_id', inv.invoice_id,
                                'number', inv.number,
                                'total_amount', inv.total_amount,
                                'status', inv.status,
                                'pdf_url', inv.pdf_url,
                                'xml_url', inv.xml_url
                            )
                        ) AS invoices
                    FROM invoices inv
                    WHERE movement_id = $1
                    GROUP BY movement_id
                )
                SELECT 
                    md.*,
                    COALESCE(pd.payments, '[]'::jsonb) AS payments,
                    COALESCE(id.installments, '[]'::jsonb) AS installments,
                    COALESCE(bd.boletos, '[]'::jsonb) AS boletos,
                    COALESCE(iv.invoices, '[]'::jsonb) AS invoices
                FROM movement_data md
                LEFT JOIN payments_data pd ON md.movement_id = pd.movement_id
                LEFT JOIN installments_data id ON md.movement_id = id.movement_id
                LEFT JOIN boletos_data bd ON id.installment_id = bd.installment_id
                LEFT JOIN invoices_data iv ON md.movement_id = iv.movement_id
            `;

            const result = await this.pool.query(customQuery, [id]);
            
            if (result.rows.length === 0) {
                logger.warn('Movimento não encontrado', { movementId: id });
                return null;
            }

            const movement = result.rows[0];

            // Log detalhado de diagnóstico
            logger.info('Diagnóstico de movimento', {
                movementId: id,
                movementDetails: {
                    movement_id: movement.movement_id,
                    description: movement.description,
                    total_amount: movement.total_amount,
                    full_name: movement.full_name,
                    status_name: movement.status_name,
                    type_name: movement.type_name,
                    payments: movement.payments?.length || 0,
                    installments: movement.installments?.length || 0,
                    boletos: movement.boletos?.length || 0,
                    invoices: movement.invoices?.length || 0
                }
            });

            return movement;
        } catch (error) {
            logger.error('Erro ao buscar movimento por ID', { 
                error: error.message, 
                movementId: id,
                stack: error.stack 
            });
            throw error;
        }
    }

    async createWithClient(data, client) {
        try {
            // Log detalhado de diagnóstico
            logger.info('Repositório: Dados para Criação de Movimento', {
                fullData: JSON.stringify(data),
                dataKeys: Object.keys(data),
                timestamp: new Date().toISOString()
            });

            // Remover campos que não devem ser inseridos
            const movementData = { ...data };
            delete movementData.payment_method_id;
            delete movementData.items;

            const columns = Object.keys(movementData);
            const values = Object.values(movementData);
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

    mapOrderByField(orderBy) {
        const orderByMapping = {
            'date': 'movement_date',
            'id': 'movement_id',
            'type': 'movement_type_id',
            'status': 'movement_status_id',
            'movement_date': 'movement_date'
        };
        return orderByMapping[orderBy] || orderBy;
    }

    buildWhereClause(filters) {
        const whereConditions = [];
        const queryParams = [];

        // Extrair filtros especiais
        const { 
            orderBy,
            orderDirection,
            startDate, 
            endDate,
            search,
            ...otherFilters 
        } = filters;

        // Converter movement_status_id para números se forem strings
        if (filters.movement_status_id) {
            if (Array.isArray(filters.movement_status_id)) {
                filters.movement_status_id = filters.movement_status_id.map(Number);
            } else {
                filters.movement_status_id = Number(filters.movement_status_id);
            }
        }

        // Filtro de status
        if (filters.movement_status_id) {
            if (Array.isArray(filters.movement_status_id)) {
                whereConditions.push(`m.movement_status_id IN (${filters.movement_status_id.map((_, index) => `$${queryParams.length + index + 1}`).join(', ')})`);
                queryParams.push(...filters.movement_status_id);
            } else {
                whereConditions.push(`m.movement_status_id = $${queryParams.length + 1}`);
                queryParams.push(filters.movement_status_id);
            }
        }

        // Filtro de data
        if (startDate && endDate) {
            whereConditions.push(`m.movement_date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`);
            queryParams.push(startDate, endDate);
        }

        // Filtro de busca textual
        if (search) {
            const searchTerm = `%${search}%`;
            whereConditions.push(`(
                m.description ILIKE $${queryParams.length + 1} OR 
                p.full_name ILIKE $${queryParams.length + 1}
            )`);
            queryParams.push(searchTerm);
        }

        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}` 
            : '';

        return { whereClause, queryParams };
    }

    getWhereClause(filters = {}) {
        const whereClauses = [];
        const values = [];
        let paramCount = 1;

        // Converter movement_status_id para números se forem strings
        if (filters.movement_status_id) {
            if (Array.isArray(filters.movement_status_id)) {
                filters.movement_status_id = filters.movement_status_id.map(Number);
            } else {
                filters.movement_status_id = Number(filters.movement_status_id);
            }
        }

        // Filtro de status com suporte a múltiplos valores
        if (filters.movement_status_id) {
            if (Array.isArray(filters.movement_status_id)) {
                // Se for um array, usa IN
                whereClauses.push(`movement_status_id IN (${filters.movement_status_id.map(id => `$${paramCount++}`).join(', ')})`);
                values.push(...filters.movement_status_id);
            } else {
                // Se for um número único, mantém a lógica atual
                whereClauses.push(`movement_status_id = $${paramCount++}`);
                values.push(filters.movement_status_id);
            }
        }

        const conditions = Object.keys(filters)
            .filter(key => key !== 'movement_status_id')
            .map((key, index) => `${key} = $${paramCount + index}`)
            .join(' AND ');

        if (conditions) {
            whereClauses.push(conditions);
            values.push(...Object.values(filters).filter(value => value !== filters.movement_status_id));
        }

        const whereClause = whereClauses.length > 0 
            ? `WHERE ${whereClauses.join(' AND ')}` 
            : '';

        return { whereClause, values };
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
        if (!paymentIds || paymentIds.length === 0) {
            logger.warn('Nenhum ID de pagamento fornecido para busca de parcelas');
            return [];
        }

        try {
            // Log detalhado dos IDs de pagamento recebidos
            logger.info('Diagnóstico de IDs de pagamento', { 
                paymentIds, 
                count: paymentIds.length,
                paymentIdsDetails: paymentIds.map(id => ({
                    id, 
                    type: typeof id
                }))
            });

            const query = `
                SELECT 
                    i.*,
                    mp.movement_id,
                    mp.total_amount as payment_total_amount,
                    mp.status as payment_status
                FROM installments i
                JOIN movement_payments mp ON i.payment_id = mp.payment_id
                WHERE i.payment_id = ANY($1)
                ORDER BY i.due_date
            `;

            const result = await this.pool.query(query, [paymentIds]);
            
            // Log detalhado de diagnóstico com mais informações
            logger.info('Diagnóstico de parcelas', { 
                totalInstallments: result.rows.length,
                paymentIdsUsed: paymentIds,
                installmentsDetails: result.rows.map(installment => ({
                    installment_id: installment.installment_id,
                    payment_id: installment.payment_id,
                    movement_id: installment.movement_id,
                    due_date: installment.due_date,
                    amount: installment.amount,
                    status: installment.status
                })),
                // Adicionar diagnóstico de junções
                joinDiagnostics: {
                    paymentsWithInstallments: new Set(result.rows.map(r => r.payment_id)).size,
                    movementsWithInstallments: new Set(result.rows.map(r => r.movement_id)).size
                }
            });

            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar parcelas', { 
                error: error.message,
                paymentIds 
            });
            return [];
        }
    }

    async findBoletosByInstallmentIds(installmentIds) {
        if (!installmentIds || installmentIds.length === 0) {
            logger.warn('Nenhum ID de parcela fornecido para busca de boletos');
            return [];
        }

        try {
            // Log detalhado dos IDs de parcelas recebidos
            logger.info('Diagnóstico de IDs de parcelas', { 
                installmentIds, 
                count: installmentIds.length,
                installmentIdsDetails: installmentIds.map(id => ({
                    id, 
                    type: typeof id
                }))
            });

            const query = `
                WITH installment_details AS (
                    SELECT 
                        i.installment_id,
                        i.payment_id,
                        mp.movement_id,
                        mp.total_amount as payment_total_amount,
                        mp.status as payment_status
                    FROM installments i
                    JOIN movement_payments mp ON i.payment_id = mp.payment_id
                    WHERE i.installment_id = ANY($1)
                ),
                boleto_details AS (
                    SELECT 
                        b.*,
                        i.installment_id,
                        i.payment_id,
                        i.movement_id,
                        i.payment_total_amount,
                        i.payment_status
                    FROM boletos b
                    JOIN installment_details i ON b.installment_id = i.installment_id
                )
                SELECT 
                    bd.*,
                    p.full_name as person_name,
                    m.description as movement_description
                FROM boleto_details bd
                JOIN persons p ON (
                    SELECT person_id 
                    FROM movements 
                    WHERE movement_id = bd.movement_id
                ) = p.person_id
                JOIN movements m ON bd.movement_id = m.movement_id
            `;

            const result = await this.pool.query(query, [installmentIds]);
            
            // Log detalhado de diagnóstico com mais informações
            logger.info('Diagnóstico de boletos', { 
                totalBoletos: result.rows.length,
                installmentIdsUsed: installmentIds,
                boletoDetails: result.rows.map(boleto => ({
                    boleto_id: boleto.boleto_id,
                    installment_id: boleto.installment_id,
                    payment_id: boleto.payment_id,
                    movement_id: boleto.movement_id,
                    status: boleto.status,
                    person_name: boleto.person_name,
                    movement_description: boleto.movement_description,
                    payment_total_amount: boleto.payment_total_amount,
                    payment_status: boleto.payment_status
                })),
                // Adicionar diagnóstico de junções
                joinDiagnostics: {
                    installmentsWithBoletos: new Set(result.rows.map(r => r.installment_id)).size,
                    paymentsWithBoletos: new Set(result.rows.map(r => r.payment_id)).size,
                    movementsWithBoletos: new Set(result.rows.map(r => r.movement_id)).size
                }
            });

            // Verificar integridade das junções
            const joinIntegrity = {
                installmentIds: {
                    requested: installmentIds.length,
                    found: new Set(result.rows.map(r => r.installment_id)).size
                },
                paymentIds: {
                    requested: new Set(result.rows.map(r => r.payment_id)).size,
                    found: new Set(result.rows.map(r => r.payment_id)).size
                },
                movementIds: {
                    requested: new Set(result.rows.map(r => r.movement_id)).size,
                    found: new Set(result.rows.map(r => r.movement_id)).size
                }
            };

            logger.warn('Integridade das junções de boletos', joinIntegrity);

            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar boletos por IDs de parcelas', { 
                error: error.message, 
                installmentIds,
                stack: error.stack 
            });
            throw new DatabaseError('Falha ao buscar boletos', error);
        }
    }

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

    async findDetailedMovement(movementId) {
        try {
            console.log('Repositório findDetailedMovement chamado:', { movementId });
            
            const query = `
                SELECT 
                    m.*, 
                    jsonb_build_object(
                        'license_id', l.license_id,
                        'license_name', l.license_name,
                        'person', jsonb_build_object(
                            'person_id', lp.person_id,
                            'full_name', lp.full_name,
                            'fantasy_name', lp.fantasy_name,
                            'birth_date', lp.birth_date,
                            'active', lp.active,
                            'person_type', lp.person_type,
                            'documents', jsonb_agg(
                                DISTINCT jsonb_build_object(
                                    'person_document_id', pd.person_document_id,
                                    'document_value', pd.document_value,
                                    'document_type', pd.document_type
                                )
                            ),
                            'addresses', jsonb_agg(
                                DISTINCT jsonb_build_object(
                                    'address_id', pa.address_id,
                                    'street', pa.street,
                                    'number', pa.number,
                                    'complement', pa.complement,
                                    'neighborhood', pa.neighborhood,
                                    'city', pa.city,
                                    'state', pa.state,
                                    'postal_code', pa.postal_code,
                                    'country', pa.country,
                                    'reference', pa.reference,
                                    'ibge', pa.ibge
                                )
                            ),
                            'contacts', jsonb_agg(
                                DISTINCT jsonb_build_object(
                                    'contact_id', c.contact_id,
                                    'contact_name', c.contact_name,
                                    'contact_value', c.contact_value,
                                    'contact_type', c.contact_type
                                )
                            )
                        ) AS license,
                    jsonb_build_object(
                        'person_id', mp.person_id,
                        'full_name', mp.full_name,
                        'fantasy_name', mp.fantasy_name,
                        'birth_date', mp.birth_date,
                        'active', mp.active,
                        'person_type', mp.person_type,
                        'documents', jsonb_agg(
                            DISTINCT jsonb_build_object(
                                'person_document_id', pd2.person_document_id,
                                'document_value', pd2.document_value,
                                'document_type', pd2.document_type
                            )
                        ),
                        'addresses', jsonb_agg(
                            DISTINCT jsonb_build_object(
                                'address_id', pa2.address_id,
                                'street', pa2.street,
                                'number', pa2.number,
                                'complement', pa2.complement,
                                'neighborhood', pa2.neighborhood,
                                'city', pa2.city,
                                'state', pa2.state,
                                'postal_code', pa2.postal_code,
                                'country', pa2.country,
                                'reference', pa2.reference,
                                'ibge', pa2.ibge
                            )
                        ),
                        'contacts', jsonb_agg(
                            DISTINCT jsonb_build_object(
                                'contact_id', c2.contact_id,
                                'contact_name', c2.contact_name,
                                'contact_value', c2.contact_value,
                                'contact_type', c2.contact_type
                            )
                        )
                    ) AS person,
                    jsonb_agg(
                        DISTINCT jsonb_build_object(
                            'movement_item_id', mi.movement_item_id,
                            'quantity', mi.quantity,
                            'unit_price', mi.unit_price,
                            'total_price', mi.total_price,
                            'description', mi.description,
                            'item_id', i.item_id,
                            'code', i.code,
                            'name', i.name,
                            'item_description', i.description,
                            'price', i.price,
                            'active', i.active,
                            'service_id', srv.service_id,
                            'service_group_id', srv.service_group_id,
                            'lc116_code', lc116.code,
                            'lc116_description', lc116.description,
                            'cnae', lc116.cnae,
                            'municipality_name', mun.municipality_name,
                            'ibge_code', mun.ibge_code,
                            'ctribmun', mun.ctribmun
                        )
                    ) AS items
                FROM movements m
                JOIN licenses l ON m.license_id = l.license_id
                JOIN persons lp ON l.person_id = lp.person_id
                LEFT JOIN person_documents pd ON lp.person_id = pd.person_id
                LEFT JOIN person_addresses pa ON lp.person_id = pa.person_id
                LEFT JOIN person_contacts pc ON lp.person_id = pc.person_id
                LEFT JOIN contacts c ON pc.contact_id = c.contact_id
                JOIN persons mp ON m.person_id = mp.person_id
                LEFT JOIN person_documents pd2 ON mp.person_id = pd2.person_id
                LEFT JOIN person_addresses pa2 ON mp.person_id = pa2.person_id
                LEFT JOIN person_contacts pc2 ON mp.person_id = pc2.person_id
                LEFT JOIN contacts c2 ON pc2.contact_id = c2.contact_id
                LEFT JOIN movement_items mi ON m.movement_id = mi.movement_id
                LEFT JOIN items i ON mi.item_id = i.item_id
                LEFT JOIN services srv ON i.item_id = srv.item_id
                LEFT JOIN service_groups sg ON srv.service_group_id = sg.service_group_id
                LEFT JOIN service_municipality mun ON sg.service_municipality_id = mun.service_municipality_id
                LEFT JOIN service_lc116 lc116 ON mun.service_lc116_id = lc116.service_lc116_id
                WHERE m.movement_id = $1
                GROUP BY m.movement_id, l.license_id, lp.person_id, mp.person_id
            `;

            const result = await this.pool.query(query, [movementId]);
            console.log('Resultado findDetailedMovement:', { 
                rowsLength: result.rows.length,
                firstRow: result.rows[0] ? Object.keys(result.rows[0]) : null,
                firstRowData: result.rows[0] ? JSON.stringify(result.rows[0]) : null
            });

            return result.rows.length > 0 
                ? MovementDetailedDTO.fromDatabase(result.rows[0]) 
                : null;
        } catch (error) {
            logger.error('Erro ao buscar movimento detalhado:', error);
            throw error;
        }
    }

    /**
     * Busca invoices por referência de movimento
     * @param {Array} referenceIds - Lista de IDs de referência
     * @returns {Promise<Array>} Lista de invoices
     */
    async findInvoicesByReferenceIds(referenceIds) {
        try {
            if (!referenceIds || referenceIds.length === 0) return [];

            const query = `
                SELECT 
                    invoice_id, 
                    reference_id, 
                    status, 
                    pdf_url, 
                    xml_url
                FROM invoices inv
                WHERE reference_id = ANY($1)
            `;

            const result = await this.pool.query(query, [referenceIds]);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar invoices por reference_ids', { error, referenceIds });
            throw new DatabaseError('Erro ao buscar invoices', error);
        }
    }
}

module.exports = MovementRepository;
