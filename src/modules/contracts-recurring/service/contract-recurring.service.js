const ContractRecurringRepository = require('../repository/contract-recurring.repository');
const ContractRecurringCreateDTO = require('../dto/contract-recurring-create.dto');
const ContractRecurringDetailedDTO = require('../dto/contract-recurring-detailed.dto');
const MovementService = require('../../movements/movement.service');
const MovementRepository = require('../../movements/movement.repository');
const PersonRepository = require('../../persons/person.repository');
const MovementTypeRepository = require('../../movement-types/movement-type.repository');
const MovementStatusRepository = require('../../movement-statuses/movement-status.repository'); 
const PaymentMethodRepository = require('../../payment-methods/payment-method.repository');
const InstallmentRepository = require('../../installments/installment.repository');
const MovementPaymentRepository = require('../../movement-payments/movement-payment.repository');
const MovementPaymentService = require('../../movement-payments/movement-payment.service');
const ContractMovementService = require('../../contract-movements/service/contract-movement.service');
const MovementItemService = require('../../movement-items/movement-item.service');
const MovementItemRepository = require('../../movement-items/movement-item.repository');
const { DatabaseError } = require('../../../utils/errors');
const { logger } = require('../../../middlewares/logger');
const { systemDatabase } = require('../../../config/database');
const N8NService = require('../../../services/n8n.service');

class ContractRecurringService {
    constructor(
        repository, 
        movementRepository, 
        movementService, 
        contractAdjustmentHistoryRepository, 
        logger,
        contractMovementService,
        movementItemService,
        movementPaymentService
    ) {
        this.repository = repository || new ContractRecurringRepository();
        this.movementRepository = movementRepository || new MovementRepository();
        this.movementService = movementService || new MovementService();
        this.contractAdjustmentHistoryRepository = contractAdjustmentHistoryRepository || new ContractAdjustmentHistoryRepository();
        this.movementItemRepository = new MovementItemRepository();
        this.dataSource = systemDatabase;
        this.logger = logger || console;
        
        const movementPaymentRepository = new MovementPaymentRepository();
        const installmentRepository = new InstallmentRepository();
        
        this.movementPaymentService = movementPaymentService || new MovementPaymentService({
            movementPaymentRepository,
            installmentRepository
        });

        this.contractMovementService = contractMovementService || new ContractMovementService();
        this.movementItemService = movementItemService || new MovementItemService();
        this.n8nService = N8NService;
    }

    async billing(contractIds) {
        const results = [];
        const client = await systemDatabase.pool.connect();

        try {
            await client.query('BEGIN');
            this.logger.info('Iniciando processamento de faturamento', { 
                contractIds, 
                timestamp: new Date().toISOString() 
            });

            for (const contractId of contractIds) {
                let contractResult = {
                    contractId,
                    status: 'pending',
                    stages: {}
                };

                try {
                    // Buscar dados do contrato
                    contractResult.stages.findContract = { started: new Date() };
                    const contract = await this.findById(contractId);
                    contractResult.stages.findContract.completed = new Date();
                    
                    // Preparar dados de faturamento
                    contractResult.stages.prepareBillingData = { started: new Date() };
                    const billingData = await this.billingPrepareData(contract);
                    contractResult.stages.prepareBillingData.completed = new Date();
                    
                    // Criar movimento de faturamento
                    contractResult.stages.createMovement = { started: new Date() };
                    const movement = await this.billingCreateMovement(billingData, client);
                    contractResult.stages.createMovement.completed = new Date();
                    
                    // Adicionar itens ao movimento
                    contractResult.stages.createMovementItems = { started: new Date() };
                    let movementItems = [];
                    if (billingData.items && billingData.items.length > 0) {
                        movementItems = await this.createMovementItems(movement, billingData.items, client);
                    }
                    contractResult.stages.createMovementItems.completed = new Date();
                    
                    // Criar pagamento do movimento
                    contractResult.stages.createPayment = { started: new Date() };
                    let payment = null;
                    try {
                        payment = await this.billingCreatePayment(contractId, {
                            billingData: {
                                ...billingData,
                                movement_id: movement.movement_id
                            },
                            client: client
                        });
                    } catch (paymentError) {
                        contractResult.stages.createPayment.error = {
                            message: paymentError.message,
                            stack: paymentError.stack
                        };
                    }
                    contractResult.stages.createPayment.completed = new Date();
                    
                    // Criar movimento de contrato
                    contractResult.stages.createContractMovement = { started: new Date() };
                    const contractMovement = await this.createContractMovement(contract, {
                        movement_id: movement.movement_id
                    }, client);
                    contractResult.stages.createContractMovement.completed = new Date();

                    // Atualizar datas de faturamento do contrato
                    contractResult.stages.updateBillingDates = { started: new Date() };
                    const updatedContract = await this.updateBillingDates(contract, {
                        movement_date: movement.movement_date
                    }, client);
                    contractResult.stages.updateBillingDates.completed = new Date();

                    contractResult.status = payment ? 'success' : 'partial_error';
                    contractResult.movement = movement;
                    contractResult.movementItems = movementItems;
                    contractResult.payment = payment;
                    contractResult.contractMovement = contractMovement;
                    contractResult.updatedContract = updatedContract;

                } catch (error) {
                    contractResult.status = 'error';
                    contractResult.errorDetails = {
                        message: error.message,
                        stack: error.stack
                    };

                    this.logger.error('Erro no processamento de faturamento para contrato', {
                        contractId,
                        errorMessage: error.message,
                        errorStack: error.stack,
                        stagesCompleted: Object.keys(contractResult.stages)
                    });
                }

                results.push(contractResult);
            }

            await client.query('COMMIT');
            this.logger.info('Processamento de faturamento concluído', { 
                totalContracts: contractIds.length,
                results: results.map(r => ({
                    contractId: r.contractId,
                    status: r.status
                }))
            });

            // Adicionar notificação assíncrona para movimentos processados
            const successfulMovements = results
                .filter(result => result.movement)
                .map(result => result.movement.movement_id);

            // Executar notificações em paralelo sem bloquear o retorno
            if (successfulMovements.length > 0) {
                this.logger.info('Preparando notificações assíncronas para movimentos', {
                    movementIds: successfulMovements
                });

                successfulMovements.forEach(movementId => {
                    this.delayNotification(movementId)
                        .catch(error => {
                            this.logger.error('Erro na notificação assíncrona', {
                                movementId,
                                errorMessage: error.message
                            });
                        });
                });
            }

            return results;

        } catch (globalError) {
            await client.query('ROLLBACK');
            this.logger.error('Erro global no processamento de faturamento', {
                errorMessage: globalError.message,
                errorStack: globalError.stack
            });
            throw globalError;
        } finally {
            client.release();
        }
    }

    async billingPrepareData(contract) {
        try {
            // Log detalhado de dados do contrato
            this.logger.info('Preparação de Faturamento - Dados do Contrato', {
                contractId: contract.contract_id,
                contractDetails: JSON.stringify(contract),
                lastBillingDate: contract.last_billing_date,
                nextBillingDate: contract.next_billing_date
            });

            // Calcular próxima data de faturamento
            const dueDate = await this.calculateBillingDueDate(contract);

            // Log de datas calculadas
            this.logger.info('Preparação de Faturamento - Datas Calculadas', {
                calculatedDueDate: dueDate,
                originalNextBillingDate: contract.next_billing_date
            });

            // Preparar dados de faturamento
            const billingData = {
                due_date: dueDate, // ATENÇÃO: Usar dueDate calculado
                next_billing_date: dueDate, // Atualizar next_billing_date
                items: contract.items,
                license_id: contract.license_id,
                movement_status_id: contract.movement_status_id,
                movement_type_id: contract.movement_type_id,
                payment_method_id: contract.payment_method,
                person_id: contract.person_id,
                reference: this.formatBillingReference(dueDate, 'current'),
                total_amount: contract.contract_value
            };

            // Log final dos dados de billing
            this.logger.info('Preparação de Faturamento - Dados Finais', {
                billingData: JSON.stringify(billingData)
            });

            return billingData;
        } catch (error) {
            this.logger.error('Erro na preparação de dados de faturamento', {
                contractId: contract.contract_id,
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async billingCreateMovement(billingData, client = null) {
        try {
            this.logger.info('Criando movimento de faturamento', { 
                timestamp: new Date().toISOString()
            });

            // Calcular movement_date
            const now = new Date();
            const nextBillingDate = new Date(billingData.next_billing_date);

            const movementDate = nextBillingDate < now 
                ? now 
                : nextBillingDate;

            // Gerar descrição do movimento
            const description = `Faturamento Contrato - Ref. ${billingData.reference}`;
            
            const movementData = {
                description: description,
                movement_date: new Date(), // Usando data atual do dia
                license_id: billingData.license_id,
                movement_status_id: billingData.movement_status_id,
                movement_type_id: billingData.movement_type_id,
                person_id: billingData.person_id,
                total_amount: billingData.total_amount
            };

            // Log detalhado do movimento
            this.logger.info('Dados do movimento de faturamento', {
                movementData: JSON.stringify(movementData)
            });

            // Criar movimento
            const movement = await this.movementRepository.create(movementData, client);

            return movement;
        } catch (error) {
            this.logger.error('Erro na criação do movimento de faturamento', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async billingCreatePayment(contractId, { billingData, client }) {
        try {
            // Garantir que temos uma data de vencimento
            const dueDate = billingData.due_date || await this.calculateBillingDueDate(billingData);

            this.logger.info('Criando pagamento para faturamento', {
                contractId,
                movementId: billingData.movement_id,
                dueDate
            });

            const paymentData = {
                movement_id: billingData.movement_id,
                payment_method_id: billingData.payment_method_id,
                total_amount: billingData.total_amount,
                due_date: dueDate,
                generateBoleto: true
            };

            // Passar o cliente de transação corretamente
            const payment = await this.movementPaymentService.create(paymentData, client);

            this.logger.info('Pagamento criado com sucesso', {
                paymentId: payment.payment_id,
                installments: payment.installments?.length || 0
            });

            return payment;
        } catch (error) {
            this.logger.error('Erro ao criar pagamento', {
                error: error.message,
                contractId,
                billingData
            });
            throw error;
        }
    }

    async updateBillingDates(contract, movementData, client = null) {
        this.logger.info('Preparando atualizar datas de faturamento', {
            contractId: contract.contract_id,
            movementDate: movementData.movement_date
        });

        try {
            this.logger.info('Iniciando atualização de datas de faturamento', {
                contractId: contract.contract_id,
                currentNextBillingDate: contract.next_billing_date
            });

            // Calcular nova data de próximo faturamento (1 mês após o atual)
            const currentNextBillingDate = new Date(contract.next_billing_date);
            const newNextBillingDate = new Date(currentNextBillingDate);
            newNextBillingDate.setMonth(newNextBillingDate.getMonth() + 1);

            // Preparar payload para atualização
            const updatePayload = {
                next_billing_date: newNextBillingDate,
                last_billing_date: movementData.movement_date || new Date()
            };

            this.logger.info('Payload de atualização de datas', {
                payload: JSON.stringify(updatePayload)
            });

            // Atualizar contrato no repositório
            const updatedContract = await this.repository.update(
                contract.contract_id, 
                updatePayload,
                client
            );

            this.logger.info('Datas de faturamento do contrato atualizadas', {
                contractId: contract.contract_id,
                oldNextBillingDate: currentNextBillingDate,
                newNextBillingDate,
                lastBillingDate: updatePayload.last_billing_date
            });

            return updatedContract;
        } catch (error) {
            this.logger.error('Erro ao atualizar datas de faturamento do contrato', {
                contractId: contract.contract_id,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            // Preparar filtros
            const queryFilters = {
                status: filters.status,
                contract_group_id: filters.contract_group_id,
                search: filters.search
            };

            // Usar findAll do repositório base
            const result = await this.repository.findAll(page, limit, queryFilters);

            // Registrar log
            this.logger.info('Contratos recorrentes listados', {
                page,
                limit,
                totalItems: result.meta.totalItems,
                filters
            });

            return result;
        } catch (error) {
            // Log de erro detalhado
            this.logger.error('Erro ao listar contratos recorrentes', {
                errorMessage: error.message,
                errorStack: error.stack,
                page,
                limit,
                filters
            });

            // Lançar erro personalizado
            throw new DatabaseError('Falha ao listar contratos recorrentes');
        }
    }

    async findById(id) {
        this.logger.info('Buscando contrato recorrente por ID', { id });

        try {
            const contract = await this.repository.findById(id);

            if (!contract) {
                this.logger.warn('Contrato não encontrado', { id });
                throw new Error('Contrato não encontrado');
            }

            return contract;
        } catch (error) {
            this.logger.error('Erro ao buscar contrato recorrente', { 
                id, 
                errorMessage: error.message 
            });
            throw error;
        }
    }

    async createMovementItems(movement, items, client = null) {
        const movementItemService = new (require('../../movement-items/movement-item.service'))();

        const createdItems = [];
        for (const item of items) {
            const movementItemData = {
                movement_id: movement.movement_id,
                item_id: item.item_id,
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price),
                total_price: Number(item.total_price || (item.quantity * item.unit_price).toFixed(2)),
                description: item.description || null
            };

            this.logger.info('Criando Item de Movimento', { movementItemData });

            try {
                const createdItem = await movementItemService.create(movementItemData, client);
                createdItems.push(createdItem);
            } catch (error) {
                this.logger.error('Erro ao criar item de movimento', {
                    errorMessage: error.message,
                    errorStack: error.stack,
                    movementItemData
                });
                throw error;
            }
        }

        return createdItems;
    }

    async createContractMovement(contract, movementData, client = null) {
        this.logger.info('Preparando criar movimento de contrato', {
            contractId: contract.contract_id,
            movementId: movementData.movement_id,
            movementData: JSON.stringify(movementData)
        });

        try {
            this.logger.info('Iniciando criação de movimento de contrato', {
                contractId: contract.contract_id,
                movementId: movementData.movement_id
            });

            const movementPayload = {
                contract_id: contract.contract_id,
                movement_id: movementData.movement_id
            };

            this.logger.info('Payload de movimento de contrato', {
                payload: JSON.stringify(movementPayload)
            });

            const contractMovement = await this.contractMovementService.create(movementPayload, client);

            this.logger.info('Movimento de contrato criado com sucesso', {
                contractId: contract.contract_id,
                movementId: movementData.movement_id,
                contractMovementId: contractMovement.id
            });

            return contractMovement;
        } catch (error) {
            this.logger.error('Erro ao criar movimento de contrato', {
                contractId: contract.contract_id,
                movementId: movementData.movement_id,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async findPendingBillings(page = 1, limit = 10, currentDate = new Date()) {
        try {
            this.logger.info('Buscando contratos pendentes de faturamento', {
                page,
                limit,
                currentDate
            });

            const result = await this.repository.findPendingBillings(page, limit, currentDate);

            this.logger.info('Contratos pendentes encontrados', {
                totalItems: result.meta.totalItems,
                totalPages: result.meta.totalPages
            });

            return result;
        } catch (error) {
            this.logger.error('Erro ao buscar contratos pendentes', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async contractAdjustment(contractIds, adjustmentValue, adjustmentType, adjustmentMode, description, changedBy) {
        // Se contractIds for um número ou string, converter para array
        if (typeof contractIds === 'number' || typeof contractIds === 'string') {
            contractIds = [contractIds];
        }

        // Validar parâmetros de entrada
        if (!contractIds || !Array.isArray(contractIds) || contractIds.length === 0) {
            throw new Error('Lista de IDs de contrato é obrigatória');
        }

        if (adjustmentValue === undefined || adjustmentValue === null) {
            throw new Error('Valor de ajuste é obrigatório');
        }

        // Validar tipo de ajuste
        if (!['percentage', 'value'].includes(adjustmentType)) {
            throw new Error('Tipo de ajuste inválido. Use "percentage" ou "value"');
        }

        // Validar modo de ajuste
        if (!['increase', 'decrease'].includes(adjustmentMode)) {
            throw new Error('Modo de ajuste inválido. Use "increase" ou "decrease"');
        }

        if (!description || description.trim() === '') {
            throw new Error('Descrição do ajuste é obrigatória');
        }

        // Validar changedBy
        if (!changedBy) {
            throw new Error('Usuário que realizou o ajuste é obrigatório');
        }

        // Armazenar payload original para retorno
        const payloadData = {
            contractIds,
            adjustmentValue,
            adjustmentType,
            adjustmentMode,
            description,
            changedBy
        };

        const results = [];
        const client = await systemDatabase.pool.connect();

        try {
            // Inicia a transação
            await client.query('BEGIN');
            this.logger.info('Iniciando processamento de ajuste de contratos', { 
                contractIds, 
                adjustmentValue, 
                adjustmentType,
                adjustmentMode,
                description,
                changedBy 
            });

            for (const contractId of contractIds) {
                try {
                    // Buscar dados do contrato
                    const contract = await this.findById(contractId);
                    
                    // Calcular novo valor do contrato
                    let newContractValue = contract.contract_value;
                    
                    // Calcular ajuste baseado no tipo e modo
                    if (adjustmentType === 'percentage') {
                        const percentageValue = adjustmentValue / 100;
                        const adjustmentAmount = contract.contract_value * percentageValue;
                        
                        newContractValue += adjustmentMode === 'increase' 
                            ? adjustmentAmount 
                            : -adjustmentAmount;
                    } else {
                        newContractValue += adjustmentMode === 'increase' 
                            ? adjustmentValue 
                            : -adjustmentValue;
                    }

                    // Arredondar valores sempre para cima
                    const formattedCurrentValue = Number.isInteger(contract.contract_value) 
                        ? Math.ceil(contract.contract_value) 
                        : Number(contract.contract_value.toFixed(2));
                    
                    const formattedNewValue = Number.isInteger(newContractValue) 
                        ? Math.ceil(newContractValue) 
                        : Number(newContractValue.toFixed(2));

                    // Validar valores antes da atualização
                    if (formattedNewValue === null || formattedNewValue === undefined || isNaN(formattedNewValue)) {
                        this.logger.error('Valor de contrato inválido', {
                            currentValue: formattedCurrentValue,
                            newContractValue: formattedNewValue,
                            adjustmentValue,
                            adjustmentType,
                            adjustmentMode
                        });
                        throw new Error('Não foi possível calcular o novo valor do contrato');
                    }

                    // Converter para string com duas casas decimais
                    const formattedNewContractValue = formattedNewValue.toFixed(0);

                    // Preparar dados de atualização
                    const updateData = {
                        contract_value: formattedNewContractValue
                    };

                    // Atualizar contrato
                    const updateContractQuery = `
                        UPDATE public.contracts_recurring 
                        SET contract_value = $1 
                        WHERE contract_id = $2
                    `;
                    await client.query(updateContractQuery, [formattedNewContractValue, contractId]);
                    
                    // Criar histórico de ajuste
                    const adjustmentHistoryData = {
                        contract_id: contractId,
                        previous_value: formattedCurrentValue,
                        new_value: formattedNewValue,
                        change_type: adjustmentType,
                        changed_by: changedBy,
                        change_date: new Date(),
                        description: description || 'Reajuste de contrato'
                    };

                    this.logger.info('Dados de histórico de ajuste', { 
                        adjustmentHistoryData, 
                        changedBy: typeof changedBy,
                        contractId: typeof contractId 
                    });

                    // Usar repositório de histórico de ajuste
                    const adjustmentHistory = await this.contractAdjustmentHistoryRepository.create(adjustmentHistoryData, client);

                    results.push({
                        contractId,
                        previousValue: formattedCurrentValue,
                        newValue: formattedNewValue,
                        adjustmentHistory: adjustmentHistory,
                        originalContract: contract,
                        payloadData // Adicionar dados do payload original
                    });

                    this.logger.info('Contrato ajustado com sucesso', { 
                        contractId, 
                        previousValue: formattedCurrentValue, 
                        newValue: formattedNewValue,
                        adjustmentMode
                    });
                } catch (contractError) {
                    this.logger.error('Erro ao ajustar contrato individual', { 
                        contractId, 
                        error: contractError.message 
                    });
                    // Continuar processando outros contratos em caso de erro
                    results.push({
                        contractId,
                        error: contractError.message,
                        payloadData // Adicionar dados do payload original mesmo em caso de erro
                    });
                }
            }

            // Commit da transação
            await client.query('COMMIT');

            return {
                results,
                payloadData // Retornar payload original junto com os resultados
            };
        } catch (error) {
            // Rollback em caso de erro
            await client.query('ROLLBACK');

            this.logger.error('Erro no processamento de ajuste de contratos', { 
                error: error.message,
                contractIds 
            });

            throw error;
        } finally {
            // Liberar cliente de conexão
            client.release();
        }
    }

    async calculateContractAdjustment(contractId, adjustmentValue, adjustmentType, adjustmentMode) {
        // Log detalhado de entrada
        this.logger.info('Calculando ajuste de contrato', {
            contractId,
            adjustmentValue,
            adjustmentType,
            adjustmentMode
        });

        // Buscar contrato
        const contract = await this.findById(contractId);
        
        // Log do contrato encontrado
        this.logger.info('Detalhes do contrato', {
            contractValue: contract.contract_value,
            contractValueType: typeof contract.contract_value
        });

        // Converter valor do contrato para número, com tratamento de erro
        let currentContractValue;
        try {
            currentContractValue = Number(contract.contract_value);
            
            // Validação adicional
            if (isNaN(currentContractValue)) {
                throw new Error('Valor do contrato não é um número válido');
            }
        } catch (error) {
            this.logger.error('Erro ao converter valor do contrato', {
                originalValue: contract.contract_value,
                error: error.message
            });
            throw error;
        }

        // Converter valor de ajuste para número
        adjustmentValue = Number(adjustmentValue);

        // Calcular novo valor
        let newValue;
        switch (adjustmentType) {
            case 'percentage':
                newValue = currentContractValue * (1 + (adjustmentValue / 100));
                break;
            case 'fixed':
                newValue = adjustmentMode === 'increase' 
                    ? currentContractValue + adjustmentValue 
                    : currentContractValue - adjustmentValue;
                break;
            default:
                throw new Error('Tipo de ajuste inválido');
        }

        // Arredondar valor calculado para número inteiro
        newValue = Math.round(newValue);

        // Log do cálculo
        this.logger.info('Resultado do cálculo de ajuste', {
            currentValue: currentContractValue,
            adjustmentValue,
            newValue,
            adjustmentType,
            adjustmentMode
        });

        // Buscar movimento modelo
        const movement = await this.movementRepository.findById(contract.model_movement_id);

        // Calcular fator de ajuste para itens de movimento
        const adjustmentFactor = newValue / currentContractValue;

        // Log final
        this.logger.info('Ajuste de contrato finalizado', {
            contractId,
            currentValue: currentContractValue,
            newValue,
            adjustmentFactor
        });

        return {
            currentValue: currentContractValue,
            newValue,
            movement,
            contract,
            adjustmentFactor
        };
    }

    async calculateMovementItemsAdjustment(movementItems, adjustmentValue, adjustmentType, adjustmentMode) {
        // Validar entrada
        if (!movementItems || !Array.isArray(movementItems)) {
            throw new Error('Lista de itens de movimento inválida');
        }

        // Converter valor de ajuste para número
        adjustmentValue = Number(adjustmentValue);

        // Calcular novos valores dos itens
        const adjustedItems = movementItems.map(item => {
            // Converter valores para número
            const currentUnitPrice = Number(item.unit_price);
            const currentTotalPrice = Number(item.total_price);
            const quantity = Number(item.quantity);

            // Calcular novo preço unitário
            let newUnitPrice = currentUnitPrice;
            
            if (adjustmentType === 'percentage') {
                const percentageValue = adjustmentValue / 100;
                const adjustmentAmount = currentUnitPrice * percentageValue;
                
                newUnitPrice += adjustmentMode === 'increase' 
                    ? adjustmentAmount 
                    : -adjustmentAmount;
            } else {
                // Ajuste em valor absoluto
                const adjustmentPerUnit = adjustmentValue / quantity;
                
                newUnitPrice += adjustmentMode === 'increase' 
                    ? adjustmentPerUnit 
                    : -adjustmentPerUnit;
            }

            // Arredondar valores sempre para cima
            const formattedUnitPrice = Math.ceil(newUnitPrice);
            const formattedTotalPrice = Math.ceil(formattedUnitPrice * quantity);

            return {
                ...item,
                unit_price: formattedUnitPrice,
                total_price: formattedTotalPrice
            };
        });

        return adjustedItems;
    }

    async processContractAdjustment(contractId, adjustmentValue, adjustmentType, adjustmentMode, changedBy, description) {
        // Validar changedBy
        if (changedBy !== null && (typeof changedBy !== 'number' || isNaN(changedBy))) {
            this.logger.error('changedBy inválido', { changedBy, type: typeof changedBy });
            throw new Error('ID do usuário inválido');
        }

        // Iniciar transação
        const client = await systemDatabase.pool.connect();

        try {
            // Iniciar transação
            await client.query('BEGIN');

            // Buscar contrato
            const contractQuery = `
                SELECT * FROM public.contracts_recurring 
                WHERE contract_id = $1 FOR UPDATE
            `;
            const contractResult = await client.query(contractQuery, [contractId]);
            
            if (contractResult.rows.length === 0) {
                throw new Error(`Contrato com ID ${contractId} não encontrado`);
            }

            const contract = contractResult.rows[0];
            const currentValue = parseFloat(contract.contract_value);

            // Calcular novo valor
            const calculation = await this.calculateContractAdjustment(
                contractId, 
                adjustmentValue, 
                adjustmentType, 
                adjustmentMode
            );
            const newContractValue = calculation.newValue;

            // Validar valores antes da atualização
            if (newContractValue === null || newContractValue === undefined || isNaN(newContractValue)) {
                this.logger.error('Valor de contrato inválido', {
                    currentValue,
                    newContractValue,
                    adjustmentValue,
                    adjustmentType,
                    adjustmentMode
                });
                throw new Error('Não foi possível calcular o novo valor do contrato');
            }

            // Converter para string com duas casas decimais
            const formattedNewContractValue = newContractValue.toFixed(0);

            // Atualizar contrato
            const updateContractQuery = `
                UPDATE public.contracts_recurring 
                SET contract_value = $1 
                WHERE contract_id = $2
            `;
            await client.query(updateContractQuery, [formattedNewContractValue, contractId]);

            // Buscar movimento modelo
            const movementQuery = `
                SELECT * FROM public.movements 
                WHERE movement_id = $1 FOR UPDATE
            `;
            const movementResult = await client.query(movementQuery, [contract.model_movement_id]);
            
            if (movementResult.rows.length === 0) {
                throw new Error(`Movimento com ID ${contract.model_movement_id} não encontrado`);
            }

            const movement = movementResult.rows[0];

            // Atualizar itens de movimento
            const updateMovementItemsQuery = `
                UPDATE public.movement_items 
                SET total_price = total_price * $1, 
                    unit_price = unit_price * $1
                WHERE movement_id = $2
            `;
            const adjustmentFactor = newContractValue / currentValue;
            await client.query(updateMovementItemsQuery, [adjustmentFactor, movement.movement_id]);

            // Atualizar movimento total
            const updateMovementQuery = `
                UPDATE public.movements 
                SET total_amount = total_amount * $1,
                total_items = total_amount * $1
                WHERE movement_id = $2
            `;
            await client.query(updateMovementQuery, [adjustmentFactor, movement.movement_id]);

            // Preparar dados para histórico de ajuste
            const adjustmentHistoryData = {
                contract_id: contractId,
                previous_value: calculation.currentValue,
                new_value: calculation.newValue,
                change_type: adjustmentType,
                changed_by: changedBy,
                change_date: new Date(),
                description: description || 'Reajuste de contrato'
            };

            this.logger.info('Dados de histórico de ajuste', { 
                adjustmentHistoryData, 
                changedBy: typeof changedBy,
                contractId: typeof contractId 
            });

            // Usar repositório de histórico de ajuste
            const adjustmentHistory = await this.contractAdjustmentHistoryRepository.create(adjustmentHistoryData, client);

            // Commit da transação
            await client.query('COMMIT');

            this.logger.info('Ajuste de contrato processado com sucesso', {
                contractId,
                oldValue: currentValue,
                newValue: newContractValue,
                adjustmentType
            });

            return {
                contractId: contract.contract_id,
                contractName: contract.contract_name,
                personName: contract.person_name,
                oldValue: currentValue,
                newValue: newContractValue,
                adjustmentHistory: adjustmentHistory
            };
        } catch (error) {
            // Rollback da transação em caso de erro
            await client.query('ROLLBACK');
            
            this.logger.error('Erro no processamento de ajuste de contrato', {
                contractId,
                error: error.message,
                stack: error.stack
            });

            throw error;
        } finally {
            // Liberar cliente de volta ao pool
            client.release();
        }
    }

    async processContractAdjustmentBatch(payload) {
        const { 
            contract_id: contractIds = [], 
            adjustmentValue, 
            adjustmentType, 
            adjustmentMode, 
            description 
        } = payload;

        // Log de entrada
        this.logger.info('Processando ajuste em lote de contratos', { 
            contractIds, 
            adjustmentValue, 
            adjustmentType, 
            adjustmentMode 
        });

        // Se nenhum contrato for especificado, buscar contratos ativos
        let targetContractIds = contractIds;
        if (targetContractIds.length === 0) {
            const activeContractsResult = await this.findAll(1, 1000, { status: 'active' });
            targetContractIds = activeContractsResult.data.map(contract => contract.contract_id);
        }

        // Log dos contratos selecionados
        this.logger.info('Contratos selecionados para ajuste', { 
            totalContracts: targetContractIds.length 
        });

        // Processar ajuste para cada contrato
        const adjustmentResults = [];
        for (const contractId of targetContractIds) {
            try {
                const adjustmentResult = await this.processContractAdjustment(
                    contractId, 
                    adjustmentValue, 
                    adjustmentType, 
                    adjustmentMode, 
                    null, // changedBy
                    description
                );
                
                adjustmentResults.push({
                    contractId,
                    success: true,
                    details: adjustmentResult
                });
            } catch (error) {
                this.logger.error('Erro ao processar ajuste de contrato', {
                    contractId,
                    error: error.message
                });
                
                adjustmentResults.push({
                    contractId,
                    success: false,
                    error: error.message
                });
            }
        }

        // Log do resultado final
        this.logger.info('Processamento de ajuste em lote concluído', {
            totalProcessed: adjustmentResults.length,
            successCount: adjustmentResults.filter(r => r.success).length,
            failureCount: adjustmentResults.filter(r => !r.success).length
        });

        return adjustmentResults;
    }

    async calculateBillingDueDate(billingData) {
        try {
            const { next_billing_date, due_day, reference = 'current' } = billingData;

            // Validações iniciais
            if (!next_billing_date) {
                throw new Error('Data de próximo faturamento não encontrada');
            }

            // Data atual e próxima data de faturamento
            const now = new Date();
            const nextBillingDate = new Date(next_billing_date);
            
            // Validar se a data de faturamento é válida
            if (isNaN(nextBillingDate.getTime())) {
                throw new Error('Data de próximo faturamento inválida');
            }

            // Dia de vencimento padrão caso não seja fornecido
            const defaultDueDay = 10;
            const targetDueDay = due_day || defaultDueDay;

            this.logger.info('Iniciando cálculo de data de vencimento', {
                reference,
                nextBillingDate: nextBillingDate.toISOString(),
                targetDueDay,
                now: now.toISOString()
            });

            // Criar data base de vencimento
            let dueDate = new Date(nextBillingDate.getFullYear(), nextBillingDate.getMonth(), targetDueDay);
            
            // Se a data base for menor que hoje, avança um mês
            if (dueDate <= now) {
                dueDate.setMonth(dueDate.getMonth() + 1);
            }

            // Para 'next current', sempre avança mais um mês
            if (reference === 'next current') {
                dueDate.setMonth(dueDate.getMonth() + 1);
            }

            this.logger.info('Data de vencimento calculada', {
                reference,
                now: now.toISOString(),
                nextBillingDate: nextBillingDate.toISOString(),
                dueDate: dueDate.toISOString(),
                targetDueDay
            });

            return dueDate.toISOString();
        } catch (error) {
            this.logger.error('Erro ao calcular data de vencimento', {
                error: error.message,
                billingData
            });
            throw error;
        }
    }

    formatBillingReference(date, reference = 'current') {
        const targetDate = new Date(date);
        
        // Ajustar data baseado no tipo de referência
        if (reference === 'current') {
            // Reference será o mês anterior
            targetDate.setMonth(targetDate.getMonth() - 1);
        } else if (reference === 'next') {
            // Reference será o mês do next_billing_date
            targetDate.setMonth(targetDate.getMonth());
        }
        
        // Formatar como MM/YYYY
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const year = targetDate.getFullYear();
        return `${month}/${year}`;
    }

    async delayNotification(movementId) {
        try {
            this.logger.info('Preparando notificação de faturamento assíncrona', {
                movementId,
                timestamp: new Date().toISOString()
            });

            // Delay de 13 segundos (8 + 5 do boleto)
            await new Promise(resolve => setTimeout(resolve, 13000));
            
            this.logger.info('Iniciando envio de notificação após delay', {
                movementId,
                delayDuration: 8000,
                timestamp: new Date().toISOString()
            });

            // Verificar se o boleto foi gerado antes de notificar
            await this.n8nService.notifyBillingMovement(movementId);

            this.logger.info('Notificação de faturamento concluída com sucesso', {
                movementId,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            this.logger.error('Erro na notificação de faturamento', {
                movementId,
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    async updateContractRecurringItem(contractId, movementItemId, updateData) {
        this.logger.info('Iniciando atualização de item de contrato recorrente', {
            contractId, 
            movementItemId, 
            updateData
        });

        const client = await this.dataSource.pool.connect();

        try {
            await client.query('BEGIN');

            // Atualizar item de movimento
            const updatedMovementItem = await this.movementItemService.update(movementItemId, updateData);
            this.logger.info('Item de movimento atualizado', { 
                updatedMovementItem,
                movementId: updatedMovementItem.movement_id 
            });

            // Buscar o movimento associado com todos os detalhes
            const movement = await this.movementRepository.findById(updatedMovementItem.movement_id);
            this.logger.info('Detalhes completos do movimento', { 
                movementId: movement.movement_id,
                totalItems: movement.total_items,
                totalAmount: movement.total_amount
            });

            // Buscar itens do movimento para verificar total
            const movementItems = await this.movementItemRepository.findByMovementId(movement.movement_id);
            const calculatedTotalItems = movementItems.reduce((total, item) => total + Number(item.total_price), 0);
            
            // Comentado: Atualização manual do movimento
            // Mantido para referência futura, mas não está sendo executado
            /*
            const calculatedTotalAmount = calculatedTotalItems - Number(movement.discount || 0) + Number(movement.addition || 0);
            const updatedMovement = await this.movementRepository.update(movement.movement_id, {
                total_items: calculatedTotalItems,
                total_amount: calculatedTotalAmount
            });
            */

            // Atualizar valor do contrato diretamente no repositório
            const updatedContract = await this.repository.update(contractId, {
                contract_value: calculatedTotalItems
            });

            this.logger.info('Contrato atualizado', { 
                contractId,
                oldValue: movement.total_amount,
                newValue: calculatedTotalItems,
                updatedContract
            });

            await client.query('COMMIT');

            return {
                movementItem: updatedMovementItem,
                contract: updatedContract
            };
        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Erro ao atualizar item de contrato recorrente', {
                contractId,
                movementItemId,
                updateData,
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async update(contractId, data, transaction = null) {
        try {
            const client = transaction || await this.dataSource.pool.connect();
            
            try {
                // Buscar contrato existente
                const contract = await this.repository.findById(contractId, client);
                if (!contract) {
                    throw new Error('Contrato não encontrado');
                }

                // Atualizar contrato
                const updatedContract = await this.repository.update(contractId, data, client);

                // Se não foi fornecida uma transação, commitar
                if (!transaction) {
                    await client.query('COMMIT');
                }

                return updatedContract;
            } catch (error) {
                if (!transaction) {
                    await client.query('ROLLBACK');
                }
                throw error;
            } finally {
                if (!transaction) {
                    client.release();
                }
            }
        } catch (error) {
            this.logger.error('Erro ao atualizar contrato recorrente', {
                contractId,
                error: error.message
            });
            throw error;
        }
    }

    async create(data, client = null) {
        try {
            // Log do payload recebido
            this.logger.info('Service: Payload recebido', { data });
            
            // Se não houver client externo, usa o método transaction do repository
            if (!client) {
                return await this.repository.transaction(async (transactionClient) => {
                    return await this._createWithTransaction(data, transactionClient);
                });
            }

            // Se houver client externo, usa ele diretamente
            return await this._createWithTransaction(data, client);
        } catch (error) {
            this.logger.error('Service: Erro ao criar contrato recorrente', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async _createWithTransaction(data, client) {
        try {
            // Iniciar transação explicitamente
            this.logger.info('Service: Iniciando transação');
            await client.query('BEGIN');

            const { 
                contract_name,
                contract_value,
                start_date,
                person_id,
                items = []
            } = data;

            this.logger.info('Service: Iniciando criação do contrato recorrente', { data });

            // Calcular total dos itens uma única vez
            const totalItems = items.reduce((sum, item) => {
                const itemTotal = item.total_price || Number((item.quantity * item.unit_price).toFixed(2));
                return sum + itemTotal;
            }, 0);

            this.logger.info('Service: Total calculado para o movimento', {
                totalItems,
                itemCount: items.length
            });

            // Criar movimento com o total já calculado
            const createdMovement = await this.movementRepository.create({
                person_id,
                description: contract_name,
                total_amount: totalItems,
                total_items: totalItems,
                movement_date: start_date,
                is_template: true,
                movement_type_id: data.movement_type_id || 3,
                movement_status_id: 1,
                license_id: data.license_id,
                addition: 0,
                discount: 0
            }, client);

            this.logger.info('Service: Movimento criado com sucesso', {
                movementId: createdMovement.movement_id,
                movement: createdMovement
            });

            // Criar itens do movimento em sequência
            const createdItems = [];
            for (const item of items) {
                const itemData = {
                    movement_id: createdMovement.movement_id,
                    item_id: item.item_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total_price: item.total_price || Number((item.quantity * item.unit_price).toFixed(2))
                };

                // Criar item sem atualizar o total do movimento
                const createdItem = await this.movementItemRepository.create(itemData, client, { skipTotalUpdate: true });
                createdItems.push(createdItem);

                this.logger.info('Service: Item do movimento criado', {
                    movementId: createdMovement.movement_id,
                    itemId: createdItem.movement_item_id,
                    item: createdItem
                });
            }

            this.logger.info('Service: Todos os itens do movimento criados', {
                movementId: createdMovement.movement_id,
                itemCount: createdItems.length,
                totalAmount: totalItems
            });

            // Ajusta a data para manter apenas a parte da data (YYYY-MM-DD)
            const startDate = new Date(data.start_date);
            const formattedStartDate = new Date(Date.UTC(
                startDate.getUTCFullYear(),
                startDate.getUTCMonth(),
                startDate.getUTCDate()
            ));

            // Criar contrato recorrente
            const contractData = {
                model_movement_id: createdMovement.movement_id,
                contract_name: data.contract_name,
                contract_value: totalItems, // Usar o total calculado
                start_date: formattedStartDate,
                recurrence_period: data.recurrence_period,
                due_day: data.due_day,
                days_before_due: data.days_before_due,
                status: data.status,
                contract_group_id: data.contract_group_id,
                billing_reference: data.billing_reference
            };

            const createdContract = await this.repository.create(contractData, client);

            this.logger.info('Service: Contrato recorrente criado com sucesso', {
                contractId: createdContract.contract_recurring_id,
                modelMovementId: createdContract.model_movement_id,
                contract: createdContract
            });

            // Criar payment e installments se payment_method_id foi fornecido
            let payment = null;
            let installments = [];
            
            if (data.payment_method_id) {
                try {
                    this.logger.info('Service: Iniciando criação de payment', {
                        movementId: createdMovement.movement_id,
                        paymentMethodId: data.payment_method_id
                    });

                    // Criar payment
                    const paymentData = {
                        movement_id: createdMovement.movement_id,
                        payment_method_id: data.payment_method_id,
                        total_amount: totalItems,
                        status: 'PENDING'
                    };

                    const paymentResult = await this.movementPaymentService.createPayment(paymentData);
                    payment = paymentResult;
                    installments = paymentResult.installments;

                    this.logger.info('Service: Payment e installments criados com sucesso', {
                        paymentId: payment.payment_id,
                        installmentsCount: installments.length
                    });
                } catch (error) {
                    this.logger.error('Service: Erro ao criar payment/installments', {
                        error: error.message,
                        stack: error.stack
                    });
                    throw error;
                }
            }

            const result = {
                contract: createdContract,
                movement: createdMovement,
                movementItems: createdItems,
                payment,
                installments
            };

            this.logger.info('Service: Resultado completo', result);

            // Commit da transação
            this.logger.info('Service: Finalizando transação com sucesso');
            await client.query('COMMIT');

            return result;
        } catch (error) {
            // Rollback explícito em caso de erro
            this.logger.info('Service: Iniciando rollback da transação');
            await client.query('ROLLBACK');
            this.logger.info('Service: Rollback concluído');
            
            this.logger.error('Service: Erro ao criar contrato recorrente na transação', {
                error: error.message,
                stack: error.stack,
                data: JSON.stringify(data)
            });
            throw error;
        }
    }

    async _createContractItem(itemData, contractId, client) {
        try {
            // Validações básicas
            if (!itemData.item_id || !itemData.quantity || !itemData.unit_price) {
                this.logger.error('Service: Dados do item inválidos', {
                    itemData: JSON.stringify(itemData)
                });
                throw new ValidationError('Dados do item inválidos');
            }

            const itemToCreate = {
                ...itemData,
                contract_id: contractId
            };

            // Criar item usando o repository
            return await this.contractItemRepository.createWithClient(itemToCreate, client);
        } catch (error) {
            this.logger.error('Service: Erro ao criar item do contrato', {
                error: error.message,
                stack: error.stack,
                itemData: JSON.stringify(itemData),
                contractId
            });
            throw error;
        }
    }

    /**
     * Encerra um contrato recorrente, atualizando seu status para 'inactive', 
     * definindo a data de encerramento e registrando o motivo no histórico.
     * 
     * @param {number} contractId - ID do contrato a ser encerrado
     * @param {Object} data - Dados para encerramento do contrato
     * @param {Date|string} data.endDate - Data de encerramento do contrato
     * @param {string} data.reason - Motivo do encerramento
     * @param {number} [data.changedBy] - ID do usuário que realizou a alteração
     * @returns {Promise<Object>} Contrato atualizado e histórico
     */
    async terminateContract(contractId, { endDate, reason, changedBy }) {
        this.logger.info('Iniciando encerramento de contrato recorrente', { 
            contractId, 
            endDate, 
            reason,
            changedBy 
        });

        // Obter cliente para transação
        const client = await this.dataSource.pool.connect();

        try {
            // Iniciar transação
            await client.query('BEGIN');

            // Buscar contrato atual para verificar status e obter valores atuais
            const currentContract = await this.findById(contractId);
            
            if (!currentContract) {
                throw new Error(`Contrato recorrente com ID ${contractId} não encontrado`);
            }

            // Preparar dados para atualização
            const updateData = {
                status: 'inactive',
                end_date: endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate
            };

            // Se o contrato já estiver inativo, apenas registra um novo histórico
            const isAlreadyInactive = currentContract.status === 'inactive';
            
            let updatedContract = currentContract;
            if (!isAlreadyInactive) {
                // Atualizar contrato apenas se não estiver inativo
                this.logger.info('Atualizando status e data de encerramento do contrato', { 
                    contractId, 
                    updateData 
                });
                
                updatedContract = await this.repository.update(contractId, updateData, client);
            }

            // Registrar no histórico
            const adjustmentHistoryData = {
                contract_id: contractId,
                previous_value: JSON.stringify({
                    status: currentContract.status || 'active',
                    end_date: currentContract.end_date || null
                }),
                new_value: JSON.stringify({
                    status: 'inactive',
                    end_date: updateData.end_date
                }),
                change_type: 'termination',
                changed_by: changedBy || null,
                change_date: new Date(),
                description: reason || (isAlreadyInactive ? 'Reconfirmação de encerramento de contrato' : 'Contrato encerrado')
            };

            this.logger.info('Registrando encerramento no histórico', { 
                contractId, 
                adjustmentHistoryData,
                isAlreadyInactive 
            });
            
            const adjustmentHistory = await this.contractAdjustmentHistoryRepository.create(
                adjustmentHistoryData, 
                client
            );

            // Commit da transação
            await client.query('COMMIT');

            this.logger.info('Contrato processado com sucesso', { 
                contractId, 
                endDate, 
                adjustmentHistory,
                status: updatedContract.status
            });

            return {
                contract: updatedContract,
                adjustmentHistory,
                wasAlreadyInactive: isAlreadyInactive
            };
        } catch (error) {
            // Rollback em caso de erro
            await client.query('ROLLBACK');
            
            this.logger.error('Erro ao processar encerramento de contrato recorrente', {
                contractId,
                endDate,
                reason,
                errorMessage: error.message,
                errorStack: error.stack
            });
            
            throw error;
        } finally {
            // Liberar cliente
            client.release();
        }
    }

    async adjustBillingDate(contractId, nextBillingDate, description, changedBy) {
        try {
            const client = await this.dataSource.pool.connect();
            
            try {
                await client.query('BEGIN');

                // Buscar contrato
                const contract = await this.findById(contractId);
                if (!contract) {
                    throw new Error('Contrato não encontrado');
                }

                // Atualizar data de faturamento
                const updateResult = await this.repository.update(contractId, {
                    next_billing_date: nextBillingDate,
                    last_billing_date: contract.last_billing_date
                }, client);

                // Criar histórico de ajuste
                await this.contractAdjustmentHistoryRepository.create({
                    contract_id: contractId,
                    adjustment_type: 'manual_billing_date',
                    previous_value: contract.next_billing_date,
                    new_value: nextBillingDate,
                    description: description || 'Ajuste manual da data de faturamento',
                    changed_by: changedBy
                }, client);

                await client.query('COMMIT');

                return {
                    success: true,
                    contractId,
                    oldDate: contract.next_billing_date,
                    newDate: nextBillingDate,
                    description
                };
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            this.logger.error('Erro ao ajustar data de faturamento', {
                contractId,
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = ContractRecurringService;
