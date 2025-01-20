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
        try {
            this.logger.info('Iniciando processamento de faturamento', { 
                contractIds,
                timestamp: new Date().toISOString()
            });

            const results = [];

            for (const contractId of contractIds) {
                try {
                    // Preparar dados de faturamento
                    const billingData = await this.billingPrepareData(contractId);

                    // COMENTADO: Criação de movimento temporariamente desativada
                    // const movement = await this.billingCreateMovement(billingData);

                    // COMENTADO: Adicionar movimento ao contrato
                    // await this.contractMovementService.create({
                    //     contract_id: contractId,
                    //     movement_id: movement.movement_id
                    // });

                    // COMENTADO: Atualização de datas de faturamento
                    // await this.updateBillingDates(contractId);

                    results.push({
                        contractId,
                        billingData,
                        status: 'prepared'
                    });

                    this.logger.info('Dados de faturamento preparados com sucesso', { 
                        contractId,
                        timestamp: new Date().toISOString()
                    });
                } catch (contractError) {
                    this.logger.error('Erro no processamento de faturamento para contrato', {
                        contractId,
                        errorMessage: contractError.message,
                        errorStack: contractError.stack,
                        timestamp: new Date().toISOString()
                    });

                    results.push({
                        contractId,
                        status: 'error',
                        errorMessage: contractError.message
                    });
                }
            }

            this.logger.info('Processamento de faturamento concluído', { 
                totalContracts: contractIds.length,
                preparedCount: results.filter(r => r.status === 'prepared').length,
                errorCount: results.filter(r => r.status === 'error').length,
                timestamp: new Date().toISOString()
            });

            return results;
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

            // Calcular data de vencimento e referência
            const { dueDate, reference } = this.calculateBillingDueDate(contract);

            const billingData = {
                person_id: movement.person?.person_id,
                movement_type_id: 3,
                movement_status_id: 2,
                payment_method_id: movementPayments[0]?.payment_method_id,
                due_date: dueDate, // Nova data de vencimento
                license_id: movement.movement.license_id,
                total_amount: movementItems.reduce((total, item) => 
                    total + (item.quantity * item.unit_price), 0),
                items: movementItems.map(item => ({
                    item_id: item.item_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price
                })),
                reference: reference // Adicionar referência
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
            this.logger.info('Iniciando criação de movimento de faturamento', {
                billingData,
                timestamp: new Date().toISOString()
            });

            // Determinar referência de billing baseado no contrato
            const billingReference = billingData.billing_reference || 'current';

            // Adicionar descrição com referência
            const description = `Faturamento de contrato referente competencia ${this.formatBillingReference(new Date(), billingReference)}`;

            // Definir movement_date como a data atual
            const movementDate = new Date();

            // Comentário: Criar movimento usando o serviço de movimento
            // Isso irá gerar um novo movimento no banco de dados
            const movement = await this.movementService.create({
                person_id: billingData.person_id,
                movement_type_id: billingData.movement_type_id,
                movement_status_id: billingData.movement_status_id,
                payment_method_id: billingData.payment_method_id,
                description: description,
                movement_date: movementDate,
                due_date: billingData.due_date,
                license_id: billingData.license_id,
                total_amount: billingData.total_amount
            });

            // Comentário: Criar itens do movimento para cada item no billingData
            for (const item of billingData.items) {
                await this.movementItemService.create({
                    movement_id: movement.movement_id,
                    item_id: item.item_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price
                });
            }

            this.logger.info('Movimento de faturamento criado com sucesso', {
                movementId: movement.movement_id,
                timestamp: new Date().toISOString()
            });

            // Retornar dados completos de faturamento
            return {
                movement: movement,
                billingData: {
                    ...billingData,
                    description: description,
                    movementDate: movementDate
                }
            };
        } catch (error) {
            this.logger.error('Erro na criação de movimento de faturamento', {
                billingData,
                errorMessage: error.message,
                errorStack: error.stack,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    async updateBillingDates(contractId) {
        try {
            this.logger.info('Iniciando atualização de datas de faturamento', { 
                contractId,
                timestamp: new Date().toISOString()
            });

            // Buscar contrato atual
            const contract = await this.repository.findById(contractId);

            if (!contract) {
                throw new DatabaseError('Contrato não encontrado');
            }

            // Definir datas de faturamento
            const currentDate = new Date();
            const lastBillingDate = currentDate;
            const nextBillingDate = new Date(currentDate);
            
            // Incrementar próximo faturamento em 1 mês
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

            // Preparar dados para atualização
            const updateData = {
                last_billing_date: lastBillingDate,
                next_billing_date: nextBillingDate
            };

            // Atualizar contrato
            const updatedContract = await this.repository.update(contractId, updateData);

            this.logger.info('Datas de faturamento atualizadas com sucesso', { 
                contractId,
                lastBillingDate,
                nextBillingDate,
                timestamp: new Date().toISOString()
            });

            return updatedContract;
        } catch (error) {
            this.logger.error('Erro ao atualizar datas de faturamento', {
                contractId,
                errorMessage: error.message,
                errorStack: error.stack,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
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
