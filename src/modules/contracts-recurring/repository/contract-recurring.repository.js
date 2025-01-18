const BaseRepository = require('../../../repositories/base/BaseRepository');
const { logger } = require('../../../middlewares/logger');

class ContractRecurringRepository extends BaseRepository {
    constructor() {
        super('contracts_recurring', 'contract_id');
    }



    async findById(id) {
        try {
            logger.info('Buscando contrato recorrente', { id });
            const query = `
                SELECT 
                    p.full_name, 
                    cg.group_name, 
                    cr.* 
                FROM public.contracts_recurring cr
                JOIN movements m ON cr.model_movement_id = m.movement_id
                JOIN persons p ON m.person_id = p.person_id
                JOIN contract_groups cg ON cr.contract_group_id = cg.contract_group_id
                WHERE cr.contract_id = $1
            `;

            logger.info('Query de busca de contrato', { query, id });

            const result = await this.pool.query(query, [id]);

            logger.info('Resultado da busca', { 
                rowCount: result.rows.length,
                rows: result.rows
            });

            if (result.rows.length === 0) {
                logger.warn('Nenhum contrato encontrado', { id });
                return null;
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar contrato recorrente por ID', { 
                id, 
                errorMessage: error.message,
                errorStack: error.stack 
            });
            throw error;
        }
    }

    async create(data) {
        try {
            const result = await this.pool.query(
                `INSERT INTO ${this.tableName} (
                    contract_name, 
                    description, 
                    start_date, 
                    end_date, 
                    recurrence_type, 
                    recurrence_interval, 
                    status, 
                    total_value, 
                    contract_group_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
                RETURNING *`,
                [
                    data.contract_name,
                    data.description,
                    data.start_date,
                    data.end_date,
                    data.recurrence_type,
                    data.recurrence_interval,
                    data.status || 'active',
                    data.total_value,
                    data.contract_group_id
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

            // Filtros adicionais
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

            logger.info('Detalhes da query customizada', {
                customQuery,
                whereClause,
                queryParams
            });

            return super.findAll(page, limit, filters, {
                customQuery,
                countQuery,
                queryParams,
                whereClause
            });
        } catch (error) {
            logger.error('Erro ao buscar contratos recorrentes', { 
                error: error.message 
            });
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
