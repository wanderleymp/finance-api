const BaseRepository = require('../../../repositories/base/BaseRepository');
const ContractExtraService = require('../model/contract-extra-service.model');
const { logger } = require('../../../middlewares/logger');

class ContractExtraServiceRepository extends BaseRepository {
    constructor() {
        super('contract_extra_services', 'extra_service_id');
    }

    async create(contractExtraService) {
        const query = `
            INSERT INTO public.contract_extra_services 
            (contract_id, service_id, item_description, item_value, service_date, movement_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING extra_service_id
        `;
        const values = [
            contractExtraService.contractId,
            contractExtraService.serviceId,
            contractExtraService.itemDescription,
            contractExtraService.itemValue,
            contractExtraService.serviceDate,
            contractExtraService.movementId
        ];

        try {
            const result = await this.pool.query(query, values);
            return result.rows[0].extra_service_id;
        } catch (error) {
            logger.error('Erro ao criar serviço extra', { error: error.message });
            throw new Error(`Erro ao criar serviço extra: ${error.message}`);
        }
    }

    async findById(extraServiceId) {
        const query = `
            SELECT * FROM public.contract_extra_services 
            WHERE extra_service_id = $1
        `;

        try {
            const result = await this.pool.query(query, [extraServiceId]);
            return result.rows.length > 0 
                ? new ContractExtraService(result.rows[0]) 
                : null;
        } catch (error) {
            logger.error('Erro ao buscar serviço extra', { error: error.message });
            throw new Error(`Erro ao buscar serviço extra: ${error.message}`);
        }
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        const { contractId, startDate, endDate } = filters;

        // Construir cláusula WHERE
        const whereClauses = [];
        const queryParams = [];
        let paramIndex = 1;

        if (contractId) {
            whereClauses.push(`contract_id = $${paramIndex}`);
            queryParams.push(contractId);
            paramIndex++;
        }

        if (startDate) {
            whereClauses.push(`service_date >= $${paramIndex}`);
            queryParams.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            whereClauses.push(`service_date <= $${paramIndex}`);
            queryParams.push(endDate);
            paramIndex++;
        }

        const whereClause = whereClauses.length > 0 
            ? `WHERE ${whereClauses.join(' AND ')}` 
            : '';

        const customQuery = `
            SELECT * FROM public.contract_extra_services
            ${whereClause}
            ORDER BY service_date DESC
        `;

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM public.contract_extra_services
            ${whereClause}
        `;

        try {
            const result = await super.findAll(page, limit, filters, {
                customQuery,
                countQuery,
                queryParams
            });

            // Tratamento para resultado undefined
            if (!result) {
                logger.warn('Resultado da busca é undefined', { filters });
                return {
                    data: [],
                    page: 1,
                    limit: 10,
                    total: 0
                };
            }

            // Transformar linhas em objetos ContractExtraService
            result.data = result.data ? 
                result.data.map(row => new ContractExtraService(row)) : 
                [];

            return result;
        } catch (error) {
            logger.error('Erro ao buscar serviços extras', { 
                error: error.message,
                filters 
            });
            throw new Error(`Erro ao buscar serviços extras: ${error.message}`);
        }
    }

    async update(extraServiceId, data) {
        const updateFields = Object.keys(data)
            .filter(key => data[key] !== undefined)
            .map((key, index) => `${key} = $${index + 2}`);

        if (updateFields.length === 0) {
            throw new Error('Nenhum campo para atualizar');
        }

        const query = `
            UPDATE public.contract_extra_services
            SET ${updateFields.join(', ')}
            WHERE extra_service_id = $1
            RETURNING *
        `;

        const values = [
            extraServiceId,
            ...updateFields.map(field => data[field.split(' = ')[0]])
        ];

        try {
            const result = await this.pool.query(query, values);
            return result.rows.length > 0 
                ? new ContractExtraService(result.rows[0]) 
                : null;
        } catch (error) {
            logger.error('Erro ao atualizar serviço extra', { error: error.message });
            throw new Error(`Erro ao atualizar serviço extra: ${error.message}`);
        }
    }

    async delete(extraServiceId) {
        const query = `
            DELETE FROM public.contract_extra_services 
            WHERE extra_service_id = $1
            RETURNING extra_service_id
        `;

        try {
            const result = await this.pool.query(query, [extraServiceId]);
            return result.rows.length > 0;
        } catch (error) {
            logger.error('Erro ao deletar serviço extra', { error: error.message });
            throw new Error(`Erro ao deletar serviço extra: ${error.message}`);
        }
    }
}

module.exports = ContractExtraServiceRepository;
