const { logger } = require('../../../middlewares/logger');
const ContractRecurringRepository = require('../repository/contract-recurring.repository');
const ContractRecurringCreateDTO = require('../dto/contract-recurring-create.dto');
const ContractRecurringDetailedDTO = require('../dto/contract-recurring-detailed.dto');
const MovementService = require('../../movements/movement.service');
const MovementItemService = require('../../movement-items/movement-item.service');
const MovementRepository = require('../../movements/movement.repository');
const PersonRepository = require('../../persons/person.repository');
const MovementTypeRepository = require('../../movement-types/movement-type.repository');
const MovementStatusRepository = require('../../movement-statuses/movement-status.repository');
const PaymentMethodRepository = require('../../payment-methods/payment-method.repository');
const InstallmentRepository = require('../../installments/installment.repository');
const MovementPaymentRepository = require('../../movement-payments/movement-payment.repository');
const { DatabaseError } = require('../../../utils/errors');

class ContractRecurringService {
    constructor() {
        this.repository = new ContractRecurringRepository();
        const movementPaymentRepository = new MovementPaymentRepository();

        this.movementService = new MovementService({
            movementRepository: new MovementRepository(),
            personRepository: new PersonRepository(),
            movementTypeRepository: new MovementTypeRepository(),
            movementStatusRepository: new MovementStatusRepository(),
            paymentMethodRepository: new PaymentMethodRepository(),
            installmentRepository: new InstallmentRepository(),
            movementPaymentService: null,
            personContactRepository: null,
            boletoRepository: null,
            boletoService: null,
            movementPaymentRepository: movementPaymentRepository,
            installmentService: null,
            licenseRepository: null,
            movementItemRepository: null,
            nfseService: null,
            serviceRepository: null,
            billingMessageService: null,
            logger: this.logger // Passar o logger existente
        });
        this.movementItemService = new MovementItemService();
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

    formatBillingReference(date) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${year}`;
    }

    async billingPrepareData(contractId) {
        this.logger.info('Iniciando preparação de dados para faturamento', { 
            contractId,
            timestamp: new Date().toISOString()
        });
        
        try {
            const contract = await this.repository.findById(contractId);
            
            if (!contract) {
                this.logger.warn('Contrato não encontrado', { 
                    contractId,
                    timestamp: new Date().toISOString()
                });
                throw new Error(`Contrato com ID ${contractId} não encontrado`);
            }

            // Recuperar dados do movimento modelo
            const movement = await this.movementService.getDetailedMovement(contract.model_movement_id);

            this.logger.warn('Detalhes do Movimento Modelo', {
                movementId: contract.model_movement_id,
                movementDetails: JSON.stringify(movement),
                timestamp: new Date().toISOString()
            });

            // Buscar movement_payments diretamente
            const movementPayments = await this.movementService.movementPaymentRepository.findByMovementId(contract.model_movement_id);

            // Recuperar itens do movimento modelo
            const movementItems = await this.movementItemService.findByMovementId(contract.model_movement_id);

            // Gerar referência de competência
            const reference = this.formatBillingReference(new Date());

            const billingData = {
                person_id: movement.person?.person_id,
                movement_type_id: 3,
                movement_status_id: 2,
                payment_method_id: movementPayments[0]?.payment_method_id,
                due_date: new Date(), // Data de vencimento padrão
                license_id: movement.movement.license_id, // Corrigir acesso ao license_id
                items: movementItems.map(item => ({
                    item_id: item.item_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price
                }))
            };

            this.logger.info('Dados de faturamento preparados', { 
                billingData,
                timestamp: new Date().toISOString()
            });

            return billingData;
        } catch (error) {
            this.logger.error('Erro na preparação de dados de faturamento', {
                contractId,
                errorMessage: error.message,
                errorStack: error.stack,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    async billingCreateMovement(billingData) {
        try {
            this.logger.info('Criando movimento de faturamento', { 
                billingData,
                timestamp: new Date().toISOString()
            });

            // Adicionar descrição com referência
            const description = `Faturamento de contrato referente competencia ${this.formatBillingReference(new Date())}`;

            // Criar movimento usando o serviço de movimento
            const movement = await this.movementService.createMovement(
                {
                    ...billingData,
                    description
                }, 
                false,  // generateBoleto 
                false,  // generateNotify
                billingData.due_date  // Passar due_date como parâmetro extra
            );

            this.logger.info('Movimento de faturamento criado com sucesso', { 
                movementId: movement.movement_id,
                timestamp: new Date().toISOString()
            });

            return movement;
        } catch (error) {
            this.logger.error('Erro ao criar movimento de faturamento', {
                billingData,
                errorMessage: error.message,
                errorStack: error.stack,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    async billing(contractIds) {
        this.logger.info('Iniciando processamento de faturamento', { 
            contractIds,
            timestamp: new Date().toISOString()
        });

        const billingResults = [];

        try {
            for (const contractId of contractIds) {
                this.logger.info(`Processando faturamento para contrato ${contractId}`, {
                    contractId,
                    timestamp: new Date().toISOString()
                });

                // Preparar dados de faturamento
                const billingData = await this.billingPrepareData(contractId);

                // Criar movimento de faturamento
                const movementResult = await this.billingCreateMovement(billingData);

                billingResults.push({
                    contractId,
                    billingData,
                    movementResult
                });
            }

            this.logger.info('Processamento de faturamento concluído', { 
                totalContracts: contractIds.length,
                billingResults,
                timestamp: new Date().toISOString()
            });

            return billingResults;
        } catch (error) {
            this.logger.error('Erro no processamento de faturamento', {
                contractIds,
                errorMessage: error.message,
                errorStack: error.stack,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
}

module.exports = ContractRecurringService;
