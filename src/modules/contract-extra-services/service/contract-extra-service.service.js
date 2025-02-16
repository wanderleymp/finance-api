const ContractExtraServiceRepository = require('../repository/contract-extra-service.repository');
const ContractExtraServiceCreateDTO = require('../dto/contract-extra-service-create.dto');
const MovementService = require('../../movements/movement.service');
const ContractRecurringRepository = require('../../contracts-recurring/repository/contract-recurring.repository');
const MovementRepository = require('../../movements/movement.repository');
const PersonRepository = require('../../persons/person.repository');
const MovementTypeRepository = require('../../movement-types/movement-type.repository');
const MovementStatusRepository = require('../../movement-statuses/movement-status.repository');
const PaymentMethodRepository = require('../../payment-methods/payment-method.repository');
const InstallmentRepository = require('../../installments/installment.repository');
const { systemDatabase } = require('../../../config/database');
const { logger } = require('../../../middlewares/logger');

class ContractExtraServiceService {
    constructor(
        repository = new ContractExtraServiceRepository(),
        movementService = new MovementService({
            movementRepository: new MovementRepository(),
            personRepository: new PersonRepository(),
            movementTypeRepository: new MovementTypeRepository(),
            movementStatusRepository: new MovementStatusRepository(),
            paymentMethodRepository: new PaymentMethodRepository(),
            installmentRepository: new InstallmentRepository()
        }),
        contractRecurringRepository = new ContractRecurringRepository(),
        logger = console
    ) {
        console.log('Repository recebido:', repository);
        console.log('Repository tem database?', repository.database);
        console.log('Repository database tem query?', typeof repository.database?.query === 'function');
        
        this.repository = repository;
        this.movementService = movementService;
        this.contractRecurringRepository = contractRecurringRepository;
        this.logger = logger;
    }

    async create(data) {
        const client = await systemDatabase.pool.connect();
        
        try {
            await client.query('BEGIN');

            // Validar dados
            const validatedData = ContractExtraServiceCreateDTO.validate(data);
            
            // Verificar se o contrato existe
            const contract = await this.contractRecurringRepository.findById(validatedData.contractId);
            if (!contract) {
                throw new Error('Contrato não encontrado');
            }

            // Criar serviço extra sem movimento
            const extraServiceId = await this.repository.create(validatedData);

            await client.query('COMMIT');
            
            this.logger.info('Serviço extra criado com sucesso', { extraServiceId });
            
            return extraServiceId;
        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Erro ao criar serviço extra', { error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    async findById(extraServiceId) {
        try {
            const extraService = await this.repository.findById(extraServiceId);
            if (!extraService) {
                throw new Error('Serviço extra não encontrado');
            }
            return extraService;
        } catch (error) {
            this.logger.error('Erro ao buscar serviço extra', { error: error.message });
            throw error;
        }
    }

    async findByContractId(contractId, filters = {}) {
        try {
            // Verificar se o contrato existe
            const contract = await this.contractRecurringRepository.findById(contractId);
            if (!contract) {
                throw new Error('Contrato não encontrado');
            }

            // Buscar serviços extras do contrato
            return await this.repository.findByContractId(contractId, filters);
        } catch (error) {
            this.logger.error('Erro ao buscar serviços extras do contrato', { 
                contractId, 
                filters, 
                error: error.message 
            });
            throw error;
        }
    }

    async findAll(filters = {}) {
        // Normalizar parâmetros
        const page = Number(filters.page) || 1;
        const limit = Number(filters.limit) || 10;
        
        // Remover campos undefined
        const cleanedFilters = Object.fromEntries(
            Object.entries(filters)
                .filter(([_, v]) => v !== undefined && v !== null)
        );

        try {
            // Buscar serviços extras com filtros
            return await this.repository.findAll(page, limit, cleanedFilters);
        } catch (error) {
            this.logger.error('Erro ao buscar serviços extras', { 
                filters: cleanedFilters, 
                error: error.message 
            });
            throw error;
        }
    }

    async update(extraServiceId, data) {
        const client = await systemDatabase.pool.connect();
        
        try {
            await client.query('BEGIN');

            // Verificar se o serviço extra existe
            const existingExtraService = await this.repository.findById(extraServiceId);
            if (!existingExtraService) {
                throw new Error('Serviço extra não encontrado');
            }

            // Atualizar movimento se o valor for alterado
            if (data.itemValue !== undefined) {
                await this.movementService.update(existingExtraService.movementId, {
                    value: data.itemValue
                }, client);
            }

            // Atualizar serviço extra
            const updatedExtraService = await this.repository.update(extraServiceId, data);

            await client.query('COMMIT');
            
            this.logger.info('Serviço extra atualizado com sucesso', { extraServiceId });
            
            return updatedExtraService;
        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Erro ao atualizar serviço extra', { error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    async delete(extraServiceId) {
        const client = await systemDatabase.pool.connect();
        
        try {
            await client.query('BEGIN');

            // Verificar se o serviço extra existe
            const existingExtraService = await this.repository.findById(extraServiceId);
            if (!existingExtraService) {
                throw new Error('Serviço extra não encontrado');
            }

            // Deletar movimento associado
            await this.movementService.delete(existingExtraService.movementId, client);

            // Deletar serviço extra
            const deleted = await this.repository.delete(extraServiceId);

            await client.query('COMMIT');
            
            this.logger.info('Serviço extra deletado com sucesso', { extraServiceId });
            
            return deleted;
        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Erro ao deletar serviço extra', { error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = ContractExtraServiceService;
