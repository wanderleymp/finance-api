const BaseRepository = require('../../../repositories/base/BaseRepository');
const { logger } = require('../../../middlewares/logger');

class ContractAdjustmentContractRepository extends BaseRepository {
    constructor() {
        super('contract_adjustment_contracts', ['adjustment_id', 'contract_id']);
    }

    async findById(adjustmentId, contractId) {
        logger.info('Buscando ajuste de contrato', { adjustmentId, contractId });

        const query = `
            SELECT 
                cac.*,
                ca.adjustment_type,
                ca.description,
                cr.contract_name,
                p.full_name as person_name
            FROM 
                contract_adjustment_contracts cac
            JOIN 
                contract_adjustments ca ON cac.adjustment_id = ca.adjustment_id
            JOIN 
                contracts_recurring cr ON cac.contract_id = cr.contract_id
            JOIN 
                movements m ON cr.model_movement_id = m.movement_id
            JOIN 
                persons p ON m.person_id = p.person_id
            WHERE 
                cac.adjustment_id = $1 AND cac.contract_id = $2
        `;

        logger.info('Query de busca de ajuste de contrato', { query, adjustmentId, contractId });

        try {
            const result = await this.pool.query(query, [adjustmentId, contractId]);

            logger.info('Resultado da busca', { 
                rowCount: result.rows.length,
                rows: result.rows
            });

            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao buscar ajuste de contrato', { 
                error: error.message, 
                adjustmentId, 
                contractId 
            });
            throw error;
        }
    }

    async findAll(page, limit, filters = {}, options = {}) {
        logger.info('Buscando ajustes de contratos', { page, limit, filters });

        // Configurar query personalizada para buscar detalhes adicionais
        const customQuery = `
            SELECT 
                cac.*,
                ca.adjustment_type,
                ca.description,
                cr.contract_name,
                p.full_name as person_name
            FROM 
                contract_adjustment_contracts cac
            LEFT JOIN 
                contract_adjustments ca ON cac.adjustment_id = ca.adjustment_id
            LEFT JOIN 
                contracts_recurring cr ON cac.contract_id = cr.contract_id
            LEFT JOIN 
                movements m ON cr.model_movement_id = m.movement_id
            LEFT JOIN 
                persons p ON m.person_id = p.person_id
            WHERE 
                1=1
        `;

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM contract_adjustment_contracts cac
            LEFT JOIN 
                contract_adjustments ca ON cac.adjustment_id = ca.adjustment_id
            LEFT JOIN 
                contracts_recurring cr ON cac.contract_id = cr.contract_id
            LEFT JOIN 
                movements m ON cr.model_movement_id = m.movement_id
            LEFT JOIN 
                persons p ON m.person_id = p.person_id
            WHERE 
                1=1
        `;

        // Adicionar filtros personalizados se existirem
        const queryParams = [];
        let whereConditions = '';
        
        Object.keys(filters).forEach((key, index) => {
            whereConditions += ` AND cac.${key} = $${index + 1}`;
            queryParams.push(filters[key]);
        });

        // Adicionar condições de filtro às queries
        const fullCustomQuery = customQuery + whereConditions;
        const fullCountQuery = countQuery + whereConditions;

        // Opções para o BaseRepository
        const repositoryOptions = {
            ...options,
            customQuery: fullCustomQuery,
            countQuery: fullCountQuery,
            queryParams
        };

        try {
            // Usar método findAll do BaseRepository
            return await super.findAll(page, limit, filters, repositoryOptions);
        } catch (error) {
            logger.error('Erro ao buscar ajustes de contratos', { 
                error: error.message, 
                page, 
                limit, 
                filters 
            });
            throw error;
        }
    }

    async create(data) {
        logger.info('Criando ajuste de contrato', { data });

        try {
            const result = await this.pool.query(
                `INSERT INTO contract_adjustment_contracts 
                (adjustment_id, contract_id, status, applied_at) 
                VALUES ($1, $2, $3, $4) 
                RETURNING *`,
                [
                    data.adjustment_id, 
                    data.contract_id, 
                    data.status || 'pending', 
                    new Date()
                ]
            );

            logger.info('Ajuste de contrato criado', { 
                adjustmentId: result.rows[0].adjustment_id,
                contractId: result.rows[0].contract_id 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar ajuste de contrato', { 
                error: error.message, 
                data 
            });
            throw error;
        }
    }

    async update(adjustmentId, contractId, data) {
        logger.info('Atualizando ajuste de contrato', { adjustmentId, contractId, data });

        const updateFields = Object.keys(data)
            .map((key, index) => `${key} = $${index + 3}`)
            .join(', ');

        if (!updateFields) {
            logger.warn('Nenhum campo para atualizar');
            return null;
        }

        const query = `
            UPDATE contract_adjustment_contracts 
            SET ${updateFields} 
            WHERE adjustment_id = $1 AND contract_id = $2 
            RETURNING *
        `;

        try {
            const result = await this.pool.query(
                query, 
                [adjustmentId, contractId, ...Object.values(data)]
            );

            logger.info('Ajuste de contrato atualizado', { 
                adjustmentId, 
                contractId 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar ajuste de contrato', { 
                error: error.message, 
                adjustmentId, 
                contractId, 
                data 
            });
            throw error;
        }
    }

    async delete(adjustmentId, contractId) {
        logger.info('Deletando ajuste de contrato', { adjustmentId, contractId });

        try {
            const result = await this.pool.query(
                `DELETE FROM contract_adjustment_contracts 
                WHERE adjustment_id = $1 AND contract_id = $2 
                RETURNING *`,
                [adjustmentId, contractId]
            );

            logger.info('Ajuste de contrato deletado', { 
                adjustmentId, 
                contractId 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao deletar ajuste de contrato', { 
                error: error.message, 
                adjustmentId, 
                contractId 
            });
            throw error;
        }
    }

    async bulkCreate(contracts) {
        logger.info('Criando ajustes de contratos em lote', { quantidade: contracts.length });

        try {
            const values = contracts.map(contract => 
                `(${contract.adjustment_id}, ${contract.contract_id}, '${contract.status || 'pending'}', NOW())`
            ).join(', ');

            const query = `
                INSERT INTO contract_adjustment_contracts 
                (adjustment_id, contract_id, status, applied_at) 
                VALUES ${values} 
                RETURNING *
            `;

            const result = await this.pool.query(query);

            logger.info('Ajustes de contratos criados em lote', { 
                quantidade: result.rows.length 
            });

            return result.rows;
        } catch (error) {
            logger.error('Erro ao criar ajustes de contratos em lote', { 
                error: error.message, 
                quantidade: contracts.length 
            });
            throw error;
        }
    }
}

module.exports = ContractAdjustmentContractRepository;
