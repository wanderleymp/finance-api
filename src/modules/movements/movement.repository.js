const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');

class MovementRepository extends BaseRepository {
    constructor() {
        super('movements', 'movement_id');
    }

    /**
     * Lista todos os movimentos com filtros
     */
    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const offset = (page - 1) * limit;
            
            // Prepara os filtros
            const queryParams = [];
            const conditions = [];
            let paramCount = 1;

            // Mapeamento de colunas permitidas para ordenação
            const allowedOrderColumns = {
                'movement_id': 'm.movement_id',
                'created_at': 'm.created_at',
                'movement_date': 'm.movement_date',
                'description': 'm.description',
                'total_amount': 'm.total_amount',
                'person_name': 'p.full_name',
                'type_name': 'mt.type_name',
                'status_name': 'ms.status_name'
            };

            // Construção da cláusula ORDER BY
            let orderByClause = 'ORDER BY m.created_at DESC';  // Default ordering
            if (filters.order_by && allowedOrderColumns[filters.order_by]) {
                const direction = (filters.order_direction || '').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
                orderByClause = `ORDER BY ${allowedOrderColumns[filters.order_by]} ${direction}`;
            }

            // Filtros básicos (exceto datas e valores)
            if (filters.person_id) {
                conditions.push(`m.person_id = $${paramCount}`);
                queryParams.push(filters.person_id);
                paramCount++;
            }

            if (filters.movement_type_id) {
                conditions.push(`m.movement_type_id = $${paramCount}`);
                queryParams.push(filters.movement_type_id);
                paramCount++;
            }

            if (filters.movement_status_id) {
                conditions.push(`m.movement_status_id = $${paramCount}`);
                queryParams.push(filters.movement_status_id);
                paramCount++;
            }

            // Filtro por valor (range)
            if (filters.value_min) {
                conditions.push(`m.total_amount >= $${paramCount}`);
                queryParams.push(filters.value_min);
                paramCount++;
            }
            if (filters.value_max) {
                conditions.push(`m.total_amount <= $${paramCount}`);
                queryParams.push(filters.value_max);
                paramCount++;
            }

            // Filtro por texto (description e full_name)
            if (filters.search) {
                conditions.push(`(
                    m.description ILIKE $${paramCount} 
                    OR p.full_name ILIKE $${paramCount}
                )`);
                queryParams.push(`%${filters.search}%`);
                paramCount++;
            }

            // Filtros de data
            if (filters.movement_date_start) {
                conditions.push(`m.movement_date >= $${paramCount}`);
                queryParams.push(filters.movement_date_start);
                paramCount++;
            }
            if (filters.movement_date_end) {
                conditions.push(`m.movement_date <= $${paramCount}`);
                queryParams.push(filters.movement_date_end);
                paramCount++;
            }

            const whereClause = conditions.length > 0 
                ? `WHERE ${conditions.join(' AND ')}` 
                : '';

            // Query base com joins essenciais
            const baseQuery = `
                FROM ${this.tableName} m
                LEFT JOIN persons p ON p.person_id = m.person_id
                LEFT JOIN movement_types mt ON mt.movement_type_id = m.movement_type_id
                LEFT JOIN movement_statuses ms ON ms.movement_status_id = m.movement_status_id
            `;

            // Query para buscar os dados
            const query = `
                SELECT 
                    m.*,
                    p.full_name as person_name,
                    mt.type_name as type_name,
                    ms.status_name as status_name
                ${baseQuery}
                ${whereClause}
                ${orderByClause}
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            // Query para contar o total
            const countQuery = `
                SELECT COUNT(DISTINCT m.movement_id) as total
                ${baseQuery}
                ${whereClause}
            `;

            logger.debug('Repository: Executando query', {
                query,
                countQuery,
                queryParams,
                paramCount
            });

            const [data, countResult] = await Promise.all([
                this.pool.query(query, [...queryParams, limit, offset]),
                this.pool.query(countQuery, queryParams)
            ]);

            const totalItems = parseInt(countResult.rows[0].total);
            const totalPages = Math.ceil(totalItems / limit);

            return {
                data: data.rows,
                pagination: {
                    page,
                    limit,
                    totalItems,
                    totalPages
                }
            };
        } catch (error) {
            logger.error('Erro ao listar registros', {
                error: error.message,
                tableName: this.tableName,
                filters
            });
            throw error;
        }
    }

    /**
     * Lista todos os movimentos com detalhes completos
     */
    async findAllDetailed(page = 1, limit = 10, filters = {}) {
        try {
            const offset = (page - 1) * limit;
            
            // Prepara os filtros
            const queryParams = [];
            const conditions = [];
            let paramCount = 1;

            // Mapeamento de colunas permitidas para ordenação
            const allowedOrderColumns = {
                'movement_id': 'm.movement_id',
                'created_at': 'm.created_at',
                'movement_date': 'm.movement_date',
                'description': 'm.description',
                'total_amount': 'm.total_amount',
                'person_name': 'p.full_name',
                'type_name': 'mt.type_name',
                'status_name': 'ms.status_name'
            };

            // Construção da cláusula ORDER BY
            let orderByClause = 'ORDER BY m.created_at DESC';  // Default ordering
            if (filters.order_by && allowedOrderColumns[filters.order_by]) {
                const direction = (filters.order_direction || '').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
                orderByClause = `ORDER BY ${allowedOrderColumns[filters.order_by]} ${direction}`;
            }

            // Filtros básicos (exceto datas e valores)
            if (filters.person_id) {
                conditions.push(`m.person_id = $${paramCount}`);
                queryParams.push(filters.person_id);
                paramCount++;
            }

            if (filters.movement_type_id) {
                conditions.push(`m.movement_type_id = $${paramCount}`);
                queryParams.push(filters.movement_type_id);
                paramCount++;
            }

            if (filters.movement_status_id) {
                conditions.push(`m.movement_status_id = $${paramCount}`);
                queryParams.push(filters.movement_status_id);
                paramCount++;
            }

            // Filtro por valor (range)
            if (filters.value_min) {
                conditions.push(`m.total_amount >= $${paramCount}`);
                queryParams.push(filters.value_min);
                paramCount++;
            }
            if (filters.value_max) {
                conditions.push(`m.total_amount <= $${paramCount}`);
                queryParams.push(filters.value_max);
                paramCount++;
            }

            // Filtro por texto (description e full_name)
            if (filters.search) {
                conditions.push(`(
                    m.description ILIKE $${paramCount} 
                    OR p.full_name ILIKE $${paramCount}
                )`);
                queryParams.push(`%${filters.search}%`);
                paramCount++;
            }

            // Filtros de data
            if (filters.movement_date_start) {
                conditions.push(`m.movement_date >= $${paramCount}`);
                queryParams.push(filters.movement_date_start);
                paramCount++;
            }
            if (filters.movement_date_end) {
                conditions.push(`m.movement_date <= $${paramCount}`);
                queryParams.push(filters.movement_date_end);
                paramCount++;
            }

            const whereClause = conditions.length > 0 
                ? `WHERE ${conditions.join(' AND ')}` 
                : '';

            // Query com todos os joins e detalhes
            const query = `
                SELECT 
                    m.*,
                    -- Dados da pessoa
                    p.full_name as person_name,
                    p.document_number as person_document,
                    p.email as person_email,
                    p.phone as person_phone,
                    -- Dados do tipo
                    mt.type_name as type_name,
                    mt.description as type_description,
                    -- Dados do status
                    ms.status_name as status_name,
                    ms.description as status_description,
                    -- Dados de pagamento
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'payment_id', mp.payment_id,
                                'payment_date', mp.payment_date,
                                'value', mp.value,
                                'status', mp.status
                            ) 
                            ORDER BY mp.payment_date
                        ) FILTER (WHERE mp.payment_id IS NOT NULL),
                        '[]'
                    ) as payments,
                    -- Dados de parcelas
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'installment_id', mi.installment_id,
                                'number', mi.number,
                                'value', mi.value,
                                'due_date', mi.due_date,
                                'status', mi.status
                            ) 
                            ORDER BY mi.number
                        ) FILTER (WHERE mi.installment_id IS NOT NULL),
                        '[]'
                    ) as installments
                FROM ${this.tableName} m
                LEFT JOIN persons p ON p.person_id = m.person_id
                LEFT JOIN movement_types mt ON mt.movement_type_id = m.movement_type_id
                LEFT JOIN movement_statuses ms ON ms.movement_status_id = m.movement_status_id
                LEFT JOIN movement_payments mp ON mp.movement_id = m.movement_id
                LEFT JOIN installments mi ON mi.movement_id = m.id
                ${whereClause}
                GROUP BY 
                    m.movement_id,
                    p.person_id,
                    mt.movement_type_id,
                    ms.movement_status_id
                ${orderByClause}
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            // Query para contar o total
            const countQuery = `
                SELECT COUNT(DISTINCT m.movement_id) as total
                FROM ${this.tableName} m
                LEFT JOIN persons p ON p.person_id = m.person_id
                LEFT JOIN movement_types mt ON mt.movement_type_id = m.movement_type_id
                LEFT JOIN movement_statuses ms ON ms.movement_status_id = m.movement_status_id
                ${whereClause}
            `;

            logger.debug('Repository: Executando query detalhada', {
                query,
                countQuery,
                queryParams,
                paramCount
            });

            const [data, countResult] = await Promise.all([
                this.pool.query(query, [...queryParams, limit, offset]),
                this.pool.query(countQuery, queryParams)
            ]);

            const totalItems = parseInt(countResult.rows[0].total);
            const totalPages = Math.ceil(totalItems / limit);

            return {
                data: data.rows,
                pagination: {
                    page,
                    limit,
                    totalItems,
                    totalPages
                }
            };
        } catch (error) {
            logger.error('Erro ao listar registros detalhados', {
                error: error.message,
                tableName: this.tableName,
                filters
            });
            throw error;
        }
    }

    /**
     * Busca movimento por ID
     */
    async findById(id) {
        try {
            const query = `
                SELECT 
                    m.*,
                    p.full_name as person_name,
                    mt.type_name as type_name,
                    ms.status_name as status_name
                FROM ${this.tableName} m
                LEFT JOIN persons p ON p.person_id = m.person_id
                LEFT JOIN movement_types mt ON mt.movement_type_id = m.movement_type_id
                LEFT JOIN movement_statuses ms ON ms.movement_status_id = m.movement_status_id
                WHERE m.movement_id = $1
            `;

            const result = await this.pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar registro por ID', {
                error: error.message,
                tableName: this.tableName,
                id
            });
            throw error;
        }
    }

    /**
     * Busca movimento por ID com todos os detalhes
     */
    async findByIdDetailed(id) {
        try {
            const query = `
                SELECT 
                    m.*,
                    -- Dados da pessoa
                    p.full_name as person_name,
                    p.document_number as person_document,
                    p.email as person_email,
                    p.phone as person_phone,
                    -- Dados do tipo
                    mt.type_name as type_name,
                    mt.description as type_description,
                    -- Dados do status
                    ms.status_name as status_name,
                    ms.description as status_description,
                    -- Dados de pagamento
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'payment_id', mp.payment_id,
                                'payment_date', mp.payment_date,
                                'value', mp.value,
                                'status', mp.status
                            ) 
                            ORDER BY mp.payment_date
                        ) FILTER (WHERE mp.payment_id IS NOT NULL),
                        '[]'
                    ) as payments,
                    -- Dados de parcelas
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'installment_id', mi.installment_id,
                                'number', mi.number,
                                'value', mi.value,
                                'due_date', mi.due_date,
                                'status', mi.status
                            ) 
                            ORDER BY mi.number
                        ) FILTER (WHERE mi.installment_id IS NOT NULL),
                        '[]'
                    ) as installments
                FROM ${this.tableName} m
                LEFT JOIN persons p ON p.person_id = m.person_id
                LEFT JOIN movement_types mt ON mt.movement_type_id = m.movement_type_id
                LEFT JOIN movement_statuses ms ON ms.movement_status_id = m.movement_status_id
                LEFT JOIN movement_payments mp ON mp.movement_id = m.movement_id
                LEFT JOIN installments mi ON mi.movement_id = m.id
                WHERE m.movement_id = $1
                GROUP BY 
                    m.movement_id,
                    p.person_id,
                    mt.movement_type_id,
                    ms.movement_status_id
            `;

            const result = await this.pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar registro detalhado por ID', {
                error: error.message,
                tableName: this.tableName,
                id
            });
            throw error;
        }
    }

    /**
     * Atualiza o status de um movimento
     */
    async updateStatus(id, status) {
        try {
            const query = `
                UPDATE ${this.tableName}
                SET movement_status_id = $1
                WHERE movement_id = $2
                RETURNING *
            `;

            const result = await this.pool.query(query, [status, id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar status', {
                error: error.message,
                tableName: this.tableName,
                id,
                status
            });
            throw error;
        }
    }
}

module.exports = MovementRepository;
