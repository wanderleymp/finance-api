const ContractRecurringRepository = require('../repository/contract-recurring.repository');
const ContractRecurringCreateDTO = require('../dto/contract-recurring-create.dto');
const ContractRecurringDetailedDTO = require('../dto/contract-recurring-detailed.dto');
const { DatabaseError } = require('../../../utils/errors');
const { logger } = require('../../../middlewares/logger');
const MovementService = require('../../movements/movement.service');
const MovementItemService = require('../../movement-items/movement-item.service');

class ContractRecurringService {
    constructor() {
        this.repository = new ContractRecurringRepository();
        this.movementService = new MovementService();
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

    async billingPrepareData(contractId) {
        this.logger.info('Preparando dados para faturamento', { contractId });
        
        // 1. Recuperar contrato completo
        const contract = await this.repository.findById(contractId);
        
        if (!contract) {
            throw new Error(`Contrato com ID ${contractId} não encontrado`);
        }

        // 2. Recuperar movimento modelo
        const modelMovementId = contract.model_movement_id;
        if (!modelMovementId) {
            throw new Error(`Nenhum movimento modelo encontrado para o contrato ${contractId}`);
        }

        // 3. Buscar movimento modelo para recuperar detalhes
        const modelMovement = await this.movementService.findById(modelMovementId);
        
        // Log completo do movimento modelo
        this.logger.info('Movimento modelo recuperado', { modelMovement });
        
        // 4. Recuperar itens do movimento modelo
        const movementItems = await this.movementItemService.findByMovementId(modelMovementId);
        
        // 5. Definir referência de faturamento
        const billingReference = this.generateBillingReference(contract.next_billing_date);

        // 6. Calcular data de vencimento
        const dueDate = this.calculateDueDate(contract.next_billing_date, contract.due_day);

        // 7. Preparar payload para criação de movimento
        return {
            contractId: contract.contract_id,
            personId: contract.person_id,
            licenseId: modelMovement.license_id,
            paymentMethodId: contract.payment_method_id,
            movementTypeId: 3, // Definido como 'venda'
            items: movementItems,
            billingReference: billingReference,
            dueDate: dueDate,
            description: `Faturamento Contrato Ref. ${billingReference}`,
            modelMovementId: modelMovementId
        };
    }

    generateBillingReference(nextBillingDate) {
        return nextBillingDate 
            ? this.formatDate(nextBillingDate, 'MM/YYYY') 
            : this.formatDate(new Date(), 'MM/YYYY');
    }

    calculateDueDate(nextBillingDate, dueDay) {
        const baseDate = nextBillingDate || new Date();
        const firstDayOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        return new Date(firstDayOfMonth.setDate(dueDay));
    }

    formatDate(date, format) {
        const formattedDate = new Date(date);
        const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
        const year = formattedDate.getFullYear();
        return format.replace('MM', month).replace('YYYY', year);
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

    async billing(contractId) {
        // Método deixado em branco para testes de montagem
        return null;
    }
}

module.exports = ContractRecurringService;
