const BaseRepository = require('../../../repositories/base/BaseRepository');
const { DatabaseError } = require('../../../utils/errors');
const ContractGroupDetailedDTO = require('../dto/contract-group-detailed.dto');

class ContractGroupRepository extends BaseRepository {
    constructor() {
        super('contract_groups', 'contract_group_id');
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const { 
                orderBy = 'group_name', 
                orderDirection = 'ASC', 
                search,
                ...otherFilters 
            } = filters;

            const orderByMapping = {
                'name': 'group_name',
                'id': 'contract_group_id'
            };

            const mappedOrderBy = orderByMapping[orderBy] || orderBy;

            const whereConditions = [];
            const queryParams = [];

            if (search) {
                const searchTerm = `%${search}%`;
                whereConditions.push(`(
                    group_name ILIKE $${queryParams.length + 1} OR 
                    group_description ILIKE $${queryParams.length + 2}
                )`);
                queryParams.push(searchTerm, searchTerm);
            }

            const whereClause = whereConditions.length > 0 
                ? `WHERE ${whereConditions.join(' AND ')}` 
                : '';

            const countQuery = `
                SELECT COUNT(*) as total 
                FROM contract_groups
                ${whereClause}
            `;

            const customQuery = `
                SELECT 
                    contract_group_id,
                    group_name,
                    group_description,
                    has_decimo_terceiro,
                    vencimento1_dia,
                    vencimento1_mes,
                    vencimento2_dia,
                    vencimento2_mes,
                    decimo_payment_method_id
                FROM contract_groups
                ${whereClause}
                ORDER BY ${mappedOrderBy} ${orderDirection}
            `;

            const result = await super.findAll(page, limit, {}, {
                customQuery,
                countQuery,
                queryParams
            });

            const processedItems = result.items.map(item => new ContractGroupDetailedDTO(item));

            return {
                items: processedItems,
                meta: result.meta,
                links: result.links
            };
        } catch (error) {
            throw new DatabaseError('Erro ao buscar grupos de contrato', error);
        }
    }
}

module.exports = ContractGroupRepository;
