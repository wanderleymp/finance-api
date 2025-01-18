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
const { DatabaseError } = require('../../../utils/errors');

class ContractRecurringService {
    constructor() {
        this.repository = new ContractRecurringRepository();
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
            movementPaymentRepository: null,
            installmentService: null,
            licenseRepository: null,
            movementItemRepository: null,
            nfseService: null,
            serviceRepository: null,
            billingMessageService: null
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
            
            this.logger.info('Dados do Contrato', { 
                contract,
                modelMovementId: contract.model_movement_id,
                timestamp: new Date().toISOString()
            });

            this.logger.info('Contrato recuperado', { 
                contract,
                timestamp: new Date().toISOString()
            });
            
            if (!contract) {
                this.logger.warn('Contrato não encontrado', { 
                    contractId,
                    timestamp: new Date().toISOString()
                });
                throw new Error(`Contrato com ID ${contractId} não encontrado`);
            }

            // Recuperar itens do movimento modelo
            const movementItems = await this.movementItemService.findByMovementId(contract.model_movement_id);

            this.logger.info('Itens do movimento recuperados', { 
                movementItems,
                movementItemsCount: movementItems.length,
                timestamp: new Date().toISOString()
            });

            // Log completo dos itens
            console.log('DEBUG Itens do Movimento COMPLETO:', JSON.stringify(movementItems, null, 2));

            console.log('DEBUG Itens do Movimento:', JSON.stringify(movementItems, null, 2));

            // Definir referência de faturamento
            const nextBillingDate = new Date(contract.next_billing_date);

            // Calcular mês e ano de referência
            let v_billing_reference;
            let dueDate;

            if (contract.billing_reference === 'current') {
                // Referência 1 mês antes da próxima data de faturamento
                const referenceDate = new Date(nextBillingDate);
                referenceDate.setMonth(referenceDate.getMonth() - 1);
                v_billing_reference = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
                
                // Vencimento no mesmo mês da próxima data de faturamento
                dueDate = new Date(nextBillingDate.getFullYear(), nextBillingDate.getMonth(), contract.due_day);
            } else {
                // Se não for 'current', usa o mês da próxima data de faturamento
                v_billing_reference = new Date(nextBillingDate.getFullYear(), nextBillingDate.getMonth(), 1);
                
                // Vencimento no próximo mês
                const nextMonth = new Date(nextBillingDate);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                dueDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), contract.due_day);
            }

            const billingData = {
                contractId: contract.contract_id,
                personId: contract.person_id,
                licenseId: contract.license_id,
                paymentMethodId: contract.payment_method_id,
                billingReference: this.formatBillingReference(v_billing_reference),
                dueDate: dueDate,
                items: movementItems.map(item => ({
                    itemId: item.item_id,
                    serviceId: item.service_id,
                    quantity: item.quantity,
                    unitValue: item.unit_price,
                    totalValue: item.total_price,
                    valor: item.total_price,
                    licenseId: contract.license_id,
                    personId: contract.person_id
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
        this.logger.info('Criando movimento de faturamento', { billingData });
        
        // TODO: Implementar criação de movimento
        // Usar serviço de movimentos
        // Registrar movimento
        return {
            movementId: null,
            message: 'movimento pendente de implementação'
        };
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
