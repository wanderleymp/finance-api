const BaseRepository = require('../../../repositories/base/BaseRepository');
const { logger } = require('../../../middlewares/logger');

class ContractRecurringRepository extends BaseRepository {
    constructor() {
        super('contracts_recurring', 'contract_id');
    }



    async findById(id, client = null) {
        logger.info('Buscando contrato recorrente', { id });

        const query = `
            SELECT 
                p.person_id,
                p.full_name, 
                cg.group_name, 
                cr.*,
                mp.payment_method_id AS payment_method,
                pm.method_name,
                m.movement_status_id,
	            m.movement_type_id,
	            m.license_id,
                (SELECT 
                     json_agg(
                         json_build_object(
                             'item_id', mi.item_id,
                             'movement_item_id', mi.movement_item_id,
                             'quantity', mi.quantity,
                             'unit_price', mi.unit_price,
                             'total_price', mi.total_price,
                             'item_name', i.name
                         )
                     )
                 FROM 
                     movement_items mi
                 JOIN 
                     items i ON mi.item_id = i.item_id
                 WHERE 
                     mi.movement_id = cr.model_movement_id
                ) AS items,
                (SELECT 
                     json_agg(ca.*)
                 FROM 
                     contract_adjustment_history ca
                 WHERE 
                     ca.contract_id = cr.contract_id
                ) AS contract_adjustments,
                json_agg(
                    json_build_object(
                        'movement_id', cm.movement_id,
                        'total_amount', cmm.total_amount,
                        'movement_date', cmm.movement_date,
                        'description', cmm.description
                    )
                ) AS billings
            FROM 
                public.contracts_recurring cr
            JOIN 
                movements m ON cr.model_movement_id = m.movement_id
            JOIN 
                persons p ON m.person_id = p.person_id
            JOIN 
                contract_groups cg ON cr.contract_group_id = cg.contract_group_id
            LEFT JOIN 
                movement_payments mp ON m.movement_id = mp.movement_id
            LEFT JOIN 
                payment_methods pm ON mp.payment_method_id = pm.payment_method_id
            LEFT JOIN 
                contract_movements cm ON cr.contract_id = cm.contract_id
            LEFT JOIN 
                movements cmm ON cm.movement_id = cmm.movement_id
            WHERE 
                cr.contract_id = $1
            GROUP BY 
                p.person_id,
                p.full_name, 
                cg.group_name, 
                cr.contract_id, 
                mp.payment_method_id,
                pm.method_name,
                m.movement_status_id,
	            m.movement_type_id,
	m.license_id
        `;

        logger.info('Query de busca de contrato', { query, id });

        const pool = client || this.pool;
        const result = await pool.query(query, [id]);

        logger.info('Resultado da busca', { 
            rowCount: result.rows.length,
            rows: result.rows
        });

        if (result.rows.length === 0) {
            logger.warn('Nenhum contrato encontrado', { id });
            return null;
        }

        return result.rows[0];
    }

    async getClient() {
        return await this.pool.connect();
    }

    async create(data, client = null) {
        try {
            const queryClient = client || this.pool;
            // Formata a data para YYYY-MM-DD
            const startDate = new Date(data.start_date);
            const formattedDate = `${startDate.getUTCFullYear()}-${String(startDate.getUTCMonth() + 1).padStart(2, '0')}-${String(startDate.getUTCDate()).padStart(2, '0')}`;

            const result = await queryClient.query(
                `INSERT INTO ${this.tableName} (
                    model_movement_id,
                    contract_name,
                    contract_value,
                    start_date,
                    recurrence_period,
                    due_day,
                    days_before_due,
                    status,
                    contract_group_id,
                    billing_reference
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
                RETURNING *`,
                [
                    data.model_movement_id,
                    data.contract_name,
                    data.contract_value,
                    formattedDate,
                    data.recurrence_period,
                    data.due_day,
                    data.days_before_due,
                    data.status || 'active',
                    data.contract_group_id,
                    data.billing_reference
                ]
            );

            logger.info('Contrato recorrente criado', { 
                id: result.rows[0].contract_id,
                name: result.rows[0].contract_name 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar contrato recorrente', { 
                data, 
                error: error.message 
            });
            throw error;
        }
    }

    async update(id, data) {
        try {
            const updateFields = [];
            const queryParams = [];
            let paramCount = 1;

            // Construir campos dinâmicos para atualização
            Object.keys(data).forEach(key => {
                if (data[key] !== undefined) {
                    updateFields.push(`${key} = $${paramCount}`);
                    queryParams.push(data[key]);
                    paramCount++;
                }
            });

            // Adicionar ID como último parâmetro
            queryParams.push(id);

            const query = `
                UPDATE ${this.tableName}
                SET ${updateFields.join(', ')}
                WHERE contract_id = $${paramCount}
                RETURNING *
            `;

            const result = await this.pool.query(query, queryParams);

            if (result.rows.length === 0) {
                logger.warn('Nenhum contrato recorrente atualizado', { id });
                return null;
            }

            logger.info('Contrato recorrente atualizado', { 
                id,
                name: result.rows[0].contract_name 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar contrato recorrente', { 
                id, 
                data, 
                error: error.message 
            });
            throw error;
        }
    }

    async delete(id) {
        try {
            const result = await this.pool.query(
                `DELETE FROM ${this.tableName} 
                 WHERE contract_id = $1 
                 RETURNING *`,
                [id]
            );

            if (result.rows.length === 0) {
                logger.warn('Nenhum contrato recorrente removido', { id });
                return false;
            }

            logger.info('Contrato recorrente removido', { id });
            return true;
        } catch (error) {
            logger.error('Erro ao remover contrato recorrente', { 
                id, 
                error: error.message 
            });
            throw error;
        }
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const whereConditions = [`cr.status = 'active'`];
            const queryParams = [];
            let paramCount = 1;

            // Filtro de busca geral
            if (filters.search) {
                whereConditions.push(`(
                    cr.contract_name ILIKE $${paramCount} OR 
                    p.full_name ILIKE $${paramCount}
                )`);
                queryParams.push(`%${filters.search}%`);
                paramCount++;
            }

            // Filtro por grupo de contrato
            if (filters.contract_group_id) {
                whereConditions.push(`cr.contract_group_id = $${paramCount}`);
                queryParams.push(filters.contract_group_id);
                paramCount++;
            }

            // Filtro por último ajuste
            if (filters.last_adjustment === 'null') {
                whereConditions.push(`(
                    cr.last_adjustment IS NULL 
                    OR cr.last_adjustment = '' 
                    OR cr.last_adjustment = 'undefined'
                )`);

                logger.info('Filtro last_adjustment:', {
                    filterValue: filters.last_adjustment,
                    whereCondition: whereConditions[whereConditions.length - 1]
                });
            } else {
                Object.keys(filters).forEach(key => {
                    const match = key.match(/^last_adjustment((<|>|<=|>=|=)(.+))?$/);
                    if (match) {
                        const operator = match[2] || '=';
                        const value = match[3] || filters[key];
                        
                        if (value === 'null') {
                            whereConditions.push('cr.last_adjustment IS NULL');
                        } else if (value && value !== 'null') {
                            let sqlOperator;
                            switch (operator) {
                                case '<': sqlOperator = '<'; break;
                                case '<=': sqlOperator = '<='; break;
                                case '>': sqlOperator = '>'; break;
                                case '>=': sqlOperator = '>='; break;
                                default: sqlOperator = '=';
                            }

                            whereConditions.push(`cr.last_adjustment ${sqlOperator} $${paramCount}`);
                            queryParams.push(new Date(value));
                            paramCount++;
                        }
                    }
                });
            }

            // Filtros adicionais anteriores
            if (filters.contract_name) {
                whereConditions.push(`cr.contract_name ILIKE $${paramCount}`);
                queryParams.push(`%${filters.contract_name}%`);
                paramCount++;
            }

            // Construir cláusula WHERE
            const whereClause = whereConditions.length > 0 
                ? `WHERE ${whereConditions.join(' AND ')}` 
                : '';

            // Query customizada com joins
            const customQuery = `
                SELECT 
                    p.full_name, 
                    cg.group_name, 
                    cr.*,
                    (SELECT 
                         json_agg(
                             json_build_object(
                                 'item_id', mi.item_id,
                                 'movement_item_id', mi.movement_item_id,
                                 'quantity', mi.quantity,
                                 'unit_price', mi.unit_price,
                                 'total_price', mi.total_price,
                                 'item_name', i.name
                             )
                         )
                     FROM 
                         movement_items mi
                     JOIN 
                         items i ON mi.item_id = i.item_id
                     WHERE 
                         mi.movement_id = cr.model_movement_id
                    ) AS items,
                    json_agg(
                        json_build_object(
                            'movement_id', cm.movement_id,
                            'movement_date', m2.movement_date,
                            'total_amount', m2.total_amount
                        )
                    ) AS billings
                FROM public.contracts_recurring cr
                JOIN movements m ON cr.model_movement_id = m.movement_id
                JOIN persons p ON m.person_id = p.person_id
                JOIN contract_groups cg ON cr.contract_group_id = cg.contract_group_id
                LEFT JOIN contract_movements cm ON cr.contract_id = cm.contract_id
                LEFT JOIN movements m2 ON cm.movement_id = m2.movement_id
                ${whereClause}
                GROUP BY p.full_name, cg.group_name, cr.contract_id
                ORDER BY cr.next_billing_date ASC
            `;

            // Consulta de contagem
            const countQuery = `
                SELECT COUNT(DISTINCT cr.contract_id) as total
                FROM public.contracts_recurring cr
                JOIN movements m ON cr.model_movement_id = m.movement_id
                JOIN persons p ON m.person_id = p.person_id
                JOIN contract_groups cg ON cr.contract_group_id = cg.contract_group_id
                ${whereClause}
            `;

            logger.info('Query customizada:', customQuery);
            logger.info('Parâmetros da query:', queryParams);

            const result = await super.findAll(page, limit, filters, {
                customQuery,
                countQuery,
                queryParams
            });

            return result;
        } catch (error) {
            logger.error('Erro ao buscar contratos recorrentes:', error);
            throw error;
        }
    }

    async findPendingBillings(page = 1, limit = 10, currentDate = new Date()) {
        try {
            const whereConditions = [
                `cr.status = 'active'`,
                `(cr.next_billing_date IS NULL OR cr.next_billing_date <= $1)`
            ];
            const queryParams = [currentDate];
            let paramCount = 2;

            // Construir cláusula WHERE
            const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

            // Query customizada com joins
            const customQuery = `
                SELECT 
                    p.full_name, 
                    cg.group_name, 
                    cr.*
                FROM public.contracts_recurring cr
                JOIN movements m ON cr.model_movement_id = m.movement_id
                JOIN persons p ON m.person_id = p.person_id
                JOIN contract_groups cg ON cr.contract_group_id = cg.contract_group_id
                ${whereClause}
                ORDER BY cr.next_billing_date ASC
            `;

            // Query de contagem
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM public.contracts_recurring cr
                JOIN movements m ON cr.model_movement_id = m.movement_id
                JOIN persons p ON m.person_id = p.person_id
                JOIN contract_groups cg ON cr.contract_group_id = cg.contract_group_id
                ${whereClause}
            `;

            logger.info('Detalhes da query de contratos pendentes', {
                customQuery,
                whereClause,
                queryParams
            });

            return super.findAll(page, limit, {}, {
                customQuery,
                countQuery,
                queryParams,
                whereClause
            });
        } catch (error) {
            logger.error('Erro ao buscar contratos pendentes de faturamento', { 
                error: error.message 
            });
            throw error;
        }
    }
}

module.exports = ContractRecurringRepository;
