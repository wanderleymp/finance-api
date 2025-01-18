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

            // Converter movement_status_id para números se forem strings
            if (filters.movement_status_id) {
                if (Array.isArray(filters.movement_status_id)) {
                    filters.movement_status_id = filters.movement_status_id.map(Number);
                } else {
                    filters.movement_status_id = Number(filters.movement_status_id);
                }
            }

            // Mapeamento de campos de ordenação
            const orderByMapping = {
                'date': 'movement_date',
                'id': 'movement_id',
                'type': 'movement_type_id',
                'status': 'movement_status_id'
            };

            // Mapear o campo de ordenação
            const mappedOrderBy = orderByMapping[orderBy] || orderBy;

            // Remover declaração duplicada e usar diretamente dos filtros
            const orderBySecondary = filters.orderBySecondary || 'movement_id';
            const orderDirectionSecondary = filters.orderDirectionSecondary || 'DESC';

            // Mapear o campo de ordenação secundária
            const mappedOrderBySecondary = orderByMapping[orderBySecondary] || orderBySecondary;

            // Construir cláusula WHERE para filtros de data
            const whereConditions = [];
            const queryParams = [];

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
                    p.full_name ILIKE $${queryParams.length + 2}
                )`);
                queryParams.push(searchTerm, searchTerm);
            }

            // Construir cláusula WHERE
            const whereClause = whereConditions.length > 0 
                ? `WHERE ${whereConditions.join(' AND ')}` 
                : '';

            // Query para contagem total
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM movements m
                LEFT JOIN movement_statuses ms ON m.movement_status_id = ms.movement_status_id
                LEFT JOIN movement_types mt ON m.movement_type_id = mt.movement_type_id
                LEFT JOIN persons p ON m.person_id = p.person_id
                ${whereClause}
            `;

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
                ${`ORDER BY m.${mappedOrderBy} ${orderDirection}, m.${mappedOrderBySecondary} ${orderDirectionSecondary}`}
            `;

            // Usa o método findAll do BaseRepository com query personalizada
            const result = await super.findAll(page, limit, {}, {
                customQuery,
                countQuery,
                queryParams
            });

            // Processamento adicional para includes, se necessário
            let processedItems = result.items || [];
            if (include) {
                const includeOptions = include.split('.');
                
                // Lógica para processamento de includes
                if (includeOptions.includes('payments')) {
                    const movementIds = processedItems.map(m => m.movement_id);
                    const payments = await this.findPaymentsByMovementIds(movementIds);
                    
                    processedItems = processedItems.map(movement => ({
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

            const totalPages = Math.ceil(result.meta.totalItems / limit);
            const currentPage = Math.min(page, totalPages);

            return {
                items: processedItems,
                meta: {
                    totalItems: result.meta.totalItems,
                    itemCount: processedItems.length,
                    itemsPerPage: limit,
                    totalPages,
                    currentPage
                },
                links: {
                    first: `/movements?page=1&limit=${limit}`,
                    previous: currentPage > 1 ? `/movements?page=${currentPage - 1}&limit=${limit}` : null,
                    next: currentPage < totalPages ? `/movements?page=${currentPage + 1}&limit=${limit}` : null,
                    last: `/movements?page=${totalPages}&limit=${limit}`
                }
            };
        } catch (error) {
            logger.error('Repository: Erro ao buscar movimentos', {
                error: error.message,
                filters,
                stack: error.stack
            });
            
            // Retorno de último recurso
            return {
                items: [],
                meta: {
                    totalItems: 0,
                    itemCount: 0,
                    itemsPerPage: limit,
                    totalPages: 1,
                    currentPage: page
                },
                links: {
                    first: `/movements?page=1&limit=${limit}`,
                    previous: null,
                    next: null,
                    last: `/movements?page=1&limit=${limit}`
                }
            };
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
                        ms.status_name
                    FROM movements m
                    LEFT JOIN movement_types mt ON mt.movement_type_id = m.movement_type_id
                    LEFT JOIN movement_statuses ms ON ms.movement_status_id = m.movement_status_id
                    WHERE m.movement_id = $1
                `;
            } else {
                query = `
                    SELECT 
                        m.*
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
            if (!installmentIds || installmentIds.length === 0) {
                return [];
            }

            logger.debug('Repository: Buscando boletos por IDs de parcelas', { 
                installmentIds,
                count: installmentIds.length 
            });

            const query = `
                WITH RankedBoletos AS (
                    SELECT 
                        b.*,
                        ROW_NUMBER() OVER (
                            PARTITION BY b.installment_id 
                            ORDER BY b.boleto_id DESC
                        ) as row_num
                    FROM boletos b
                    WHERE b.installment_id = ANY($1)
                )
                SELECT 
                    installment_id,
                    boleto_id,
                    boleto_number,
                    boleto_url,
                    status,
                    generated_at,
                    codigo_barras,
                    linha_digitavel,
                    pix_copia_e_cola,
                    external_boleto_id
                FROM RankedBoletos
                WHERE row_num = 1
            `;

            const result = await this.pool.query(query, [installmentIds]);
            
            logger.debug('Repository: Boletos encontrados', { 
                count: result.rows.length 
            });

            return result.rows;
        } catch (error) {
            logger.error('Repository: Erro ao buscar boletos por IDs de parcelas', {
                error: error.message,
                installmentIds
            });
            throw error;
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
}

module.exports = MovementRepository;
