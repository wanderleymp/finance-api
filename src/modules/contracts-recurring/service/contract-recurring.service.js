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
const ContractMovementService = require('../../contract-movements/service/contract-movement.service');
const MovementItemService = require('../../movement-items/movement-item.service');
const MovementItemRepository = require('../../movement-items/movement-item.repository');
const { DatabaseError } = require('../../../utils/errors');
const { logger } = require('../../../middlewares/logger');
const { systemDatabase } = require('../../../config/database');

class ContractRecurringService {
    constructor(
        repository, 
        movementRepository, 
        movementService, 
        contractAdjustmentHistoryRepository, 
        logger
    ) {
        this.repository = repository || new ContractRecurringRepository();
        this.movementRepository = movementRepository || new MovementRepository();
        this.movementService = movementService || new MovementService();
        this.contractAdjustmentHistoryRepository = contractAdjustmentHistoryRepository || new ContractAdjustmentHistoryRepository();
        this.movementItemRepository = new MovementItemRepository();
        this.dataSource = systemDatabase;
        this.logger = logger || console;
    }

    async billing(contractIds) {
        const results = [];
        const client = await systemDatabase.pool.connect();

        try {
            // Inicia a transação
            await client.query('BEGIN');
            this.logger.info('Iniciando processamento de faturamento', { contractIds });

            for (const contractId of contractIds) {
                try {
                    // Buscar dados do contrato
                    const contractDetails = await this.repository.findById(contractId);
                    this.logger.info('Detalhes do contrato encontrados', { 
                        contractId, 
                        contractName: contractDetails.contract_name 
                    });
                    
                    // Preparar dados de faturamento
                    const billingData = await this.billingPrepareData(contractId);
                    this.logger.info('Dados de faturamento preparados', { 
                        contractId, 
                        billingData 
                    });
                    
                    // Criar movimento de faturamento
                    const movement = await this.billingCreateMovement(billingData, client);
                    this.logger.info('Movimento de faturamento criado', { 
                        contractId, 
                        movementId: movement.movement_id,
                        movementDetails: movement 
                    });
                    
                    // Adicionar itens ao movimento
                    let movementItems = [];
                    if (billingData.items && billingData.items.length > 0) {
                        movementItems = await this.createMovementItems(movement, billingData.items, client);
                        this.logger.info('Itens de movimento criados', { 
                            contractId, 
                            movementId: movement.movement_id,
                            movementItemsCount: movementItems.length 
                        });
                    }
                    
                    // Criar pagamento do movimento
                    let payment = null;
                    try {
                        payment = await this.billingCreatePayment(contractId, {
                            billingData: {
                                ...billingData,
                                movement_id: movement.movement_id
                            },
                            transaction: client
                        });
                        this.logger.info('Pagamento criado com sucesso', { 
                            contractId, 
                            paymentDetails: payment 
                        });
                    } catch (paymentError) {
                        this.logger.error('Erro ao criar pagamento', {
                            contractId,
                            errorMessage: paymentError.message,
                            errorStack: paymentError.stack
                        });
                    }
                    
                    // Criar movimento de contrato
                    const contractMovement = await this.createContractMovement(contractDetails, {
                        movement_id: movement.movement_id,
                        value: movement.total_amount,
                        type: 'RECURRING',
                        status: 'ACTIVE',
                        description: `Faturamento Contrato ${contractId}`,
                        due_date: billingData.due_date,
                        reference_date: billingData.reference
                    });

                    // Atualizar datas de faturamento do contrato
                    const updatedContract = await this.updateBillingDates(contractDetails, {
                        movement_date: movement.movement_date
                    });

                    results.push({
                        contractId,
                        movement,
                        movementItems,
                        payment,
                        billingData,
                        status: payment ? 'success' : 'partial_error',
                        contractMovement,
                        updatedContract
                    });

                } catch (error) {
                    this.logger.error('Erro no processamento de faturamento para contrato', {
                        contractId,
                        errorMessage: error.message,
                        errorStack: error.stack
                    });

                    results.push({
                        contractId,
                        movement: null,
                        movementItems: [],
                        payment: null,
                        billingData: null,
                        status: 'error',
                        errorMessage: error.message
                    });
                }
            }

            // Commit da transação
            await client.query('COMMIT');
            this.logger.info('Processamento de faturamento concluído', { 
                totalContracts: contractIds.length,
                resultCount: results.length 
            });

            // Notificação de faturamento assíncrona com delay
            const delayNotification = async (movementId) => {
                try {
                    this.logger.info('Preparando notificação de faturamento assíncrona', {
                        movementId,
                        timestamp: new Date().toISOString()
                    });

                    // Delay de 8 segundos
                    await new Promise(resolve => setTimeout(resolve, 8000));
                    
                    this.logger.info('Iniciando envio de notificação após delay', {
                        movementId,
                        delayDuration: 8000,
                        timestamp: new Date().toISOString()
                    });

                    // Verificar se o boleto foi gerado antes de notificar
                    const n8nService = require('../../../services/n8n.service');
                    await n8nService.notifyBillingMovement(movementId);

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
                }
            };

            // Iniciar notificação em background sem aguardar
            for (const result of results) {
                if (result.movement) {
                    this.logger.info('Agendando notificação de faturamento', {
                        movementId: result.movement.movement_id,
                        timestamp: new Date().toISOString()
                    });
                    delayNotification(result.movement.movement_id);
                }
            }

            return results;
        } catch (error) {
            // Rollback em caso de erro geral
            await client.query('ROLLBACK');
            this.logger.error('Erro geral no processamento de faturamento', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        } finally {
            // Sempre liberar o cliente
            client.release();
        }
    }

    async billingPrepareData(contractId) {
        try {
            // Buscar contrato
            const contract = await this.repository.findById(contractId);

            // Log detalhado de dados do contrato
            this.logger.info('Preparação de Faturamento - Dados do Contrato', {
                contractId,
                contractDetails: JSON.stringify(contract),
                lastBillingDate: contract.last_billing_date,
                nextBillingDate: contract.next_billing_date
            });

            // Calcular próxima data de faturamento
            const { dueDate, reference } = this.calculateBillingDueDate(contract);

            // Log de datas calculadas
            this.logger.info('Preparação de Faturamento - Datas Calculadas', {
                calculatedDueDate: dueDate,
                calculatedReference: reference,
                originalNextBillingDate: contract.next_billing_date
            });

            // Buscar movimento modelo
            const modelMovement = await this.movementRepository.findById(contract.model_movement_id);

            // Preparar dados de faturamento
            const billingData = {
                due_date: dueDate, // ATENÇÃO: Usar dueDate calculado
                next_billing_date: dueDate, // Atualizar next_billing_date
                items: await this.movementService.findMovementItemsByMovementId(contract.model_movement_id),
                license_id: modelMovement.license_id,
                movement_status_id: modelMovement.movement_status_id,
                movement_type_id: modelMovement.movement_type_id,
                payment_method_id: modelMovement.payment_method_id,
                person_id: modelMovement.person_id,
                reference: reference,
                total_amount: modelMovement.total_amount
            };

            // Log final dos dados de billing
            this.logger.info('Preparação de Faturamento - Dados Finais', {
                billingData: JSON.stringify(billingData)
            });

            return billingData;
        } catch (error) {
            this.logger.error('Erro na preparação de dados de faturamento', {
                contractId,
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

    async billingCreatePayment(contractId, { billingData, transaction }) {
        try {
            // Definir método de pagamento padrão (1 = Padrão)
            const paymentMethodId = 1;

            // Preparar dados do pagamento
            const paymentData = {
                movement_id: billingData.movement_id,
                payment_method_id: 1,
                total_amount: billingData.total_amount,
                due_date: billingData.due_date
            };

            // Criar pagamento
            const payment = await this.movementPaymentRepository.create(paymentData, { transaction });

            return payment;
        } catch (error) {
            this.logger.error('Erro ao criar pagamento de movimento', {
                contractId,
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async updateBillingDates(contract, movementData) {
        try {
            // Calcular nova data de próximo faturamento (1 mês após o atual)
            const currentNextBillingDate = new Date(contract.next_billing_date);
            const newNextBillingDate = new Date(currentNextBillingDate);
            newNextBillingDate.setMonth(newNextBillingDate.getMonth() + 1);

            // Preparar payload para atualização
            const updatePayload = {
                next_billing_date: newNextBillingDate,
                last_billing_date: movementData.movement_date || new Date()
            };

            // Atualizar contrato no repositório
            const updatedContract = await this.repository.update(
                contract.contract_id, 
                updatePayload
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
                error: error.message,
                contractId: contract.contract_id
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
                errorName: error.name,
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
                const createdItem = await this.movementService.updateMovementItem(
                    { movement_item_id: item.movement_item_id },
                    movementItemData,
                    client
                );
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

    async createContractMovement(contract, movementData) {
        try {
            const movementPayload = {
                contract_id: contract.contract_id,
                movement_id: movementData.movement_id,
            };

            const contractMovement = await this.contractMovementService.create(movementPayload);

            this.logger.info('Movimento de contrato criado com sucesso', {
                contractId: contract.contract_id,
                movementId: movementData.movement_id,
                contractMovementId: contractMovement.id
            });

            return contractMovement;
        } catch (error) {
            this.logger.error('Erro ao criar movimento de contrato', {
                error: error.message,
                contract: contract.contract_id,
                movementData
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
                    const contract = await this.repository.findById(contractId);
                    
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
        const contract = await this.repository.findById(contractId);
        
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
                error: error.message,
                stack: error.stack,
                contractId
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

    async calculateBillingDueDate(contract, currentDate = new Date(), reference = 'current') {
        // Validar entrada
        if (!contract) {
            throw new Error('Contrato inválido');
        }

        // Determinar a data de próximo faturamento
        const nextBillingDate = contract.next_billing_date;

        if (!nextBillingDate) {
            throw new Error('Data de próximo faturamento não encontrada');
        }

        // Converter para objeto Date se for string
        const billingDate = typeof nextBillingDate === 'string' 
            ? new Date(nextBillingDate) 
            : new Date(nextBillingDate);

        // Determinar o dia de vencimento
        const dueDayOfMonth = contract.due_day || billingDate.getDate();

        // Clonar a data para não modificar o original
        const dueDate = new Date(billingDate);

        // Lógica para calcular dueDate baseado no tipo de referência
        if (reference === 'next') {
            // Para 'next', adiciona 1 mês e ajusta para o dia de vencimento
            dueDate.setMonth(dueDate.getMonth() + 1);
            dueDate.setDate(dueDayOfMonth);
        } else if (reference === 'current') {
            // Para 'current', ajusta para o dia de vencimento
            dueDate.setDate(dueDayOfMonth);

            // Se a data de vencimento for menor que hoje, adiciona 1 dia
            if (dueDate < currentDate) {
                dueDate.setDate(currentDate.getDate() + 1);
            }
        }

        // Gerar referência no formato MM/YYYY
        const billingReference = this.formatBillingReference(dueDate, reference);

        this.logger.info('Cálculo de data de vencimento', {
            contractId: contract.contract_id,
            nextBillingDate: billingDate,
            dueDate,
            reference: billingReference,
            referenceType: reference,
            timestamp: new Date().toISOString()
        });

        return {
            dueDate,
            reference: billingReference
        };
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
}

module.exports = ContractRecurringService;
