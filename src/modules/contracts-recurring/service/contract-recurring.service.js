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
const { DatabaseError } = require('../../../utils/errors');
const { logger } = require('../../../middlewares/logger');

class ContractRecurringService {
    constructor() {
        this.repository = new ContractRecurringRepository();
        const movementPaymentRepository = new MovementPaymentRepository();
        const installmentRepository = new InstallmentRepository();
        const MovementPaymentService = require('../../movement-payments/movement-payment.service');
        this.movementPaymentService = new MovementPaymentService({
            movementPaymentRepository: movementPaymentRepository,
            installmentRepository: installmentRepository
        });
        this.contractMovementService = new ContractMovementService();

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

    async billing(contractIds) {
        const results = [];
        const client = await this.repository.pool.connect();

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
                    
                    results.push({
                        contractId,
                        movement,
                        movementItems,
                        payment,
                        billingData,
                        status: payment ? 'success' : 'partial_error'
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
            const modelMovement = await this.movementService.findById(contract.model_movement_id);

            // Preparar dados de faturamento
            const billingData = {
                due_date: dueDate, // ATENÇÃO: Usar dueDate calculado
                next_billing_date: dueDate, // Atualizar next_billing_date
                items: await this.movementItemService.findByMovementId(contract.model_movement_id),
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

            // Gerar descrição do movimento
            const description = `Faturamento Contrato - Ref. ${billingData.reference}`;
            
            // Definir data do movimento baseado em next_billing_date
            const today = new Date().toISOString().split('T')[0];
            const movementDate = new Date(billingData.next_billing_date) < new Date(today) 
                ? today 
                : billingData.next_billing_date;

            // Criar movimento
            const movement = await this.movementService.create({
                person_id: billingData.person_id,
                movement_type_id: billingData.movement_type_id,
                movement_status_id: billingData.movement_status_id,
                description: description,
                movement_date: movementDate,
                license_id: billingData.license_id,
                total_amount: billingData.total_amount
            }, client);

            this.logger.info('Movimento de faturamento criado com sucesso', { 
                movementId: movement.movement_id,
                timestamp: new Date().toISOString()
            });

            // Retornar movimento completo
            return movement;

        } catch (error) {
            this.logger.error('Erro ao criar movimento de faturamento', {
                errorMessage: error.message,
                errorStack: error.stack,
                timestamp: new Date().toISOString()
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
            const payment = await this.movementPaymentService.create(paymentData, { transaction });

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

    async updateBillingDates(contractId, client) {
        const contract = await this.repository.findById(contractId);
        
        // Calcular próxima data de faturamento
        const { dueDate, reference } = this.calculateBillingDueDate(contract);

        // Preparar dados para atualização
        const updateData = {
            next_billing_date: dueDate,
            billing_reference: reference
        };

        // Usar o cliente de transação para atualizar
        const query = `
            UPDATE contracts_recurring 
            SET next_billing_date = $1, billing_reference = $2 
            WHERE contract_id = $3
            RETURNING *
        `;

        const result = await client.query(query, [
            updateData.next_billing_date, 
            updateData.billing_reference, 
            contractId
        ]);

        this.logger.info('Datas de faturamento atualizadas', { 
            contractId, 
            nextBillingDate: updateData.next_billing_date,
            billingReference: updateData.billing_reference
        });

        return result.rows[0];
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            // Validar e preparar parâmetros
            const offset = (page - 1) * limit;

            // Construir query base
            let query = `
                SELECT 
                    cr.*,
                    p.full_name AS person_name,
                    cg.group_name,
                    m.total_amount,
                    m.movement_date
                FROM 
                    contracts_recurring cr
                LEFT JOIN persons p ON cr.person_id = p.person_id
                LEFT JOIN contract_groups cg ON cr.contract_group_id = cg.contract_group_id
                LEFT JOIN movements m ON cr.model_movement_id = m.movement_id
                WHERE 1=1
            `;

            // Adicionar filtros dinâmicos
            const queryParams = [];
            let paramCount = 1;

            if (filters.status) {
                query += ` AND cr.status = $${paramCount}`;
                queryParams.push(filters.status);
                paramCount++;
            }

            if (filters.contract_group_id) {
                query += ` AND cr.contract_group_id = $${paramCount}`;
                queryParams.push(filters.contract_group_id);
                paramCount++;
            }

            // Adicionar ordenação e paginação
            query += ` 
                ORDER BY cr.created_at DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;
            queryParams.push(limit, offset);

            // Executar consulta
            const result = await this.repository.query(query, queryParams);

            // Contar total de registros
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM contracts_recurring cr
                WHERE 1=1
                ${filters.status ? `AND cr.status = $1` : ''}
                ${filters.contract_group_id ? `AND cr.contract_group_id = $${filters.status ? 2 : 1}` : ''}
            `;
            const countParams = filters.status || filters.contract_group_id 
                ? [filters.status, filters.contract_group_id].filter(Boolean) 
                : [];
            
            const totalResult = await this.repository.query(countQuery, countParams);
            const total = parseInt(totalResult[0]?.total || 0);

            // Registrar log
            this.logger.info('Contratos recorrentes listados', {
                page,
                limit,
                totalItems: total,
                filters
            });

            return {
                data: result,
                meta: {
                    page,
                    limit,
                    totalItems: total,
                    totalPages: Math.ceil(total / limit)
                }
            };
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

    calculateBillingDueDate(contract, currentDate = new Date()) {
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
            : nextBillingDate;

        // Clonar a data para não modificar o original
        const dueDate = new Date(billingDate);

        // Determinar o dia de vencimento
        const dueDayOfMonth = contract.due_day || billingDate.getDate();

        // Definir o dia de vencimento no próximo mês
        dueDate.setMonth(dueDate.getMonth() + 1);
        dueDate.setDate(dueDayOfMonth);

        // Gerar referência no formato MM/YYYY
        const reference = this.formatBillingReference(dueDate);

        this.logger.info('Cálculo de data de vencimento', {
            contractId: contract.contract_id,
            nextBillingDate: billingDate,
            dueDate,
            reference,
            timestamp: new Date().toISOString()
        });

        return {
            dueDate,
            reference
        };
    }

    formatBillingReference(date, reference = 'current') {
        const targetDate = new Date(date);
        
        // Ajustar data para mês corrente ou próximo
        if (reference === 'next') {
            targetDate.setMonth(targetDate.getMonth() + 1);
        }
        
        // Formatar como MM/YYYY
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const year = targetDate.getFullYear();
        return `${month}/${year}`;
    }
}

module.exports = ContractRecurringService;
