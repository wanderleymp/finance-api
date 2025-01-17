const BaseRepository = require('../../../repositories/base/BaseRepository');
const { logger } = require('../../../middlewares/logger');

class ContractRecurringRepository extends BaseRepository {
    constructor() {
        super('contracts_recurring', 'contract_id');
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            // Log detalhado da estrutura da tabela
            const tableInfoQuery = `
                SELECT column_name, data_type, character_maximum_length, column_default, is_nullable
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE table_name = 'contracts_recurring'
            `;
            
            const tableInfo = await this.pool.query(tableInfoQuery);
            logger.info('Estrutura da tabela contracts_recurring', {
                columns: tableInfo.rows
            });

            const whereConditions = [];
            const queryParams = [];
            let paramCount = 1;

            // Filtro por nome do contrato
            if (filters.contract_name) {
                whereConditions.push(`contract_name ILIKE $${paramCount}`);
                queryParams.push(`%${filters.contract_name}%`);
                paramCount++;
            }

            // Filtro por status
            if (filters.status) {
                whereConditions.push(`status = $${paramCount}`);
                queryParams.push(filters.status);
                paramCount++;
            }

            // Construir cláusula WHERE
            const whereClause = whereConditions.length > 0 
                ? `WHERE ${whereConditions.join(' AND ')}` 
                : '';

            // Construir queries
            const customQuery = `
                SELECT * FROM ${this.tableName}
                ${whereClause}
                ORDER BY contract_id DESC
            `;

            const countQuery = `
                SELECT COUNT(*) as total 
                FROM ${this.tableName}
                ${whereClause}
            `;

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
}

module.exports = ContractRecurringRepository;
