const BaseRepository = require('../../../repositories/base/BaseRepository');
const { DatabaseError } = require('../../../utils/errors');
const ContractMovementDetailedDTO = require('../dto/contract-movement-detailed.dto');

class ContractMovementRepository extends BaseRepository {
    constructor() {
        super('contract_movements', ['contract_id', 'movement_id']);
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            const { 
                orderBy = 'contract_id', 
                orderDirection = 'ASC', 
                search,
                ...otherFilters 
            } = filters;

            const orderByMapping = {
                'contract_id': 'contract_id',
                'movement_id': 'movement_id'
            };

            const mappedOrderBy = orderByMapping[orderBy] || orderBy;

            const whereConditions = [];
            const queryParams = [];

            const whereClause = whereConditions.length > 0 
                ? `WHERE ${whereConditions.join(' AND ')}` 
                : '';

            const countQuery = `
                SELECT COUNT(*) as total 
                FROM contract_movements
                ${whereClause}
            `;

            const customQuery = `
                SELECT 
                    contract_id,
                    movement_id
                FROM contract_movements
                ${whereClause}
                ORDER BY ${mappedOrderBy} ${orderDirection}
            `;

            const result = await super.findAll(page, limit, {}, {
                customQuery,
                countQuery,
                queryParams
            });

            return {
                data: result.items.map(item => new ContractMovementDetailedDTO(item)),
                meta: result.meta,
                links: result.links
            };
        } catch (error) {
            throw new DatabaseError('Erro ao buscar movimentos de contrato', error);
        }
    }
}

module.exports = ContractMovementRepository;
