const ContractRecurringRepository = require('../repository/contract-recurring.repository');
const ContractRecurringCreateDTO = require('../dto/contract-recurring-create.dto');
const ContractRecurringDetailedDTO = require('../dto/contract-recurring-detailed.dto');
const { DatabaseError } = require('../../../utils/errors');
const { logger } = require('../../../middlewares/logger');

class ContractRecurringService {
    constructor() {
        this.repository = new ContractRecurringRepository();
        this.logger = logger;
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        this.logger.info('Buscando contratos recorrentes', { page, limit, filters });
        const result = await this.repository.findAll(page, limit, filters);
        
        this.logger.info('Contratos recorrentes encontrados', { 
            total: result.meta.totalItems, 
            page, 
            limit 
        });
        
        const mappedRows = result.items.map(row => 
            ContractRecurringDetailedDTO.fromEntity(row)
        );

        return {
            data: mappedRows,
            meta: result.meta,
            links: result.links
        };
    }

    async findById(id) {
        this.logger.info('Buscando contrato recorrente por ID', { id });
        const result = await this.repository.findById(id);
        
        if (!result) {
            this.logger.warn('Contrato recorrente não encontrado', { id });
            throw new DatabaseError('Contrato recorrente não encontrado');
        }

        this.logger.info('Contrato recorrente encontrado', { id });
        return ContractRecurringDetailedDTO.fromEntity(result);
    }

    async create(data) {
        this.logger.info('Criando novo contrato recorrente', { data });
        const validatedData = ContractRecurringCreateDTO.validate(data);
        const result = await this.repository.create(validatedData);
        this.logger.info('Contrato recorrente criado com sucesso', { 
            id: result.contract_recurring_id 
        });
        return ContractRecurringDetailedDTO.fromEntity(result);
    }

    async update(id, data) {
        this.logger.info('Atualizando contrato recorrente', { id, data });
        const existingRecord = await this.repository.findById(id);
        
        if (!existingRecord) {
            this.logger.warn('Contrato recorrente não encontrado para atualização', { id });
            throw new DatabaseError('Contrato recorrente não encontrado');
        }

        const validatedData = ContractRecurringCreateDTO.validate(data);
        const result = await this.repository.update(id, validatedData);
        this.logger.info('Contrato recorrente atualizado com sucesso', { 
            id, 
            updatedData: result 
        });
        return ContractRecurringDetailedDTO.fromEntity(result);
    }

    async delete(id) {
        this.logger.info('Removendo contrato recorrente', { id });
        const existingRecord = await this.repository.findById(id);
        
        if (!existingRecord) {
            this.logger.warn('Contrato recorrente não encontrado para remoção', { id });
            throw new DatabaseError('Contrato recorrente não encontrado');
        }

        await this.repository.delete(id);
        this.logger.info('Contrato recorrente removido com sucesso', { id });
    }

    async findPendingBillings(page = 1, limit = 10, currentDate = new Date()) {
        this.logger.info('Buscando contratos pendentes de faturamento', { page, limit, currentDate });
        
        const result = await this.repository.findPendingBillings(page, limit, currentDate);
        
        this.logger.info('Contratos pendentes encontrados', { 
            total: result.meta.totalItems, 
            page, 
            limit 
        });
        
        const mappedRows = result.items.map(row => 
            ContractRecurringDetailedDTO.fromEntity(row)
        );

        return {
            data: mappedRows,
            meta: result.meta,
            links: result.links
        };
    }
}

module.exports = ContractRecurringService;
