const MovementService = require('../services/MovementService');
const MovementPaymentRepository = require('../repositories/implementations/PrismaMovementRepository');
const InstallmentGenerationService = require('../services/InstallmentGenerationService');
const logger = require('../../config/logger');

class SaleController {
    constructor() {
        this.movementPaymentRepository = new MovementPaymentRepository();
        this.installmentGenerationService = new InstallmentGenerationService();
        this.movementService = new MovementService();
    }

    // Método para processar os itens da venda
    processSaleItems(body) {
        logger.info('🟢 [SALE-ITEMS-PROCESS] Processando itens da venda', { body });

        // Se for um array de itens completo, retorna como está
        if (Array.isArray(body.items)) {
            return body.items.map(item => ({
                product_id: parseInt(item.product_id),
                quantity: parseFloat(item.quantity),
                unit_value: parseFloat(item.unit_value)
            }));
        }

        // Se for apenas um item_id, cria um item com quantidade 1 e valor total
        if (body.item_id && !body.items) {
            const processedItem = [{
                product_id: parseInt(body.item_id),
                quantity: 1,
                unit_value: parseFloat(body.total_amount)
            }];

            logger.info('🟢 [SALE-ITEMS-SINGLE] Item único processado', { processedItem });
            return processedItem;
        }

        // Se nenhum formato conhecido for encontrado, lança um erro
        logger.error('🔴 [SALE-ITEMS-ERROR] Formato de itens inválido', { body });
        throw new Error('Formato de itens inválido');
    }

    async createSale(req, res) {
        try {
            logger.info('🔵 [SALE-START] Iniciando criação de venda', { 
                body: req.body,
                userId: req.user.id 
            });

            // Validar campos obrigatórios
            const requiredFields = ['person_id', 'total_amount', 'payment_method_id', 'movement_type_id', 'license_id'];
            for (const field of requiredFields) {
                if (!req.body[field]) {
                    logger.error(`🔴 [SALE-VALIDATION-ERROR] Campo ${field} é obrigatório`, { body: req.body });
                    throw new Error(`Campo ${field} é obrigatório`);
                }
            }

            // Processar itens da venda
            const processedItems = this.processSaleItems(req.body);
            logger.info('🟢 [SALE-ITEMS] Itens processados', { processedItems });

            // 1. Criar o movimento de venda
            const saleData = {
                person_id: parseInt(req.body.person_id),
                movement_type_id: parseInt(req.body.movement_type_id),
                movement_date: new Date(),
                total_amount: parseFloat(req.body.total_amount),
                total_items: processedItems.length,
                license_id: parseInt(req.body.license_id),
                description: req.body.description || 'Venda de item',
                items: processedItems
            };

            logger.info('🟢 [SALE-MOVEMENT-CREATE] Criando movimento de venda', saleData);
            const sale = await this.movementService.createMovement(saleData, req.user.id);
            logger.info('🟢 [SALE-MOVEMENT] Movimento criado', { 
                movement_id: sale.movement_id,
                total_amount: sale.total_amount 
            });

            // 2. Criar o pagamento
            const paymentData = {
                movement_id: sale.movement_id,
                payment_method_id: parseInt(req.body.payment_method_id),
                total_amount: parseFloat(sale.total_amount)
            };

            logger.info('🟢 [SALE-PAYMENT-CREATE] Criando pagamento', paymentData);
            const payment = await this.movementPaymentRepository.createMovementPaymentWithInstallments(paymentData);
            logger.info('🟢 [SALE-PAYMENT] Pagamento criado com parcelas', {
                payment_id: payment.movementPayment.payment_id,
                total_amount: payment.movementPayment.total_amount,
                installments_count: payment.installments.length
            });

            logger.info('🔵 [SALE-COMPLETE] Venda concluída com sucesso', {
                sale_id: sale.movement_id,
                payment_id: payment.movementPayment.payment_id,
                total_amount: sale.total_amount
            });

            res.status(201).json({
                sale,
                payment: payment.movementPayment,
                installments: payment.installments
            });
        } catch (error) {
            logger.error('🔴 [SALE-ERROR] Erro ao criar venda', { 
                error: error.message, 
                stack: error.stack,
                body: req.body 
            });

            if (error.message.includes('obrigatório') || error.message.includes('inválido')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Erro ao criar venda: ' + error.message });
        }
    }

    async getSaleById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            
            logger.info('🔵 [SALE-GET-BY-ID] Buscando venda por ID', { id, userId });
            const sale = await this.movementService.getMovementById(id, userId);
            
            // Verificar se é uma venda
            if (sale.movement_type_id !== 1) {
                return res.status(404).json({ error: 'Sale not found' });
            }

            logger.info('🟢 [SALE-FOUND] Venda encontrada', { sale });
            res.json(sale);
        } catch (error) {
            logger.error('🔴 [SALE-GET-BY-ID-ERROR] Erro ao buscar venda por ID', error);
            if (error.message === 'Movement not found') {
                return res.status(404).json({ error: 'Sale not found' });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getAllSales(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                sortBy = 'movement_date',
                sortOrder = 'desc',
                startDate,
                endDate,
                personId,
                minAmount,
                maxAmount,
                paymentMethodId,
                licenseId,
                ...otherFilters
            } = req.query;

            const userId = req.user.id;
            
            logger.info('🔵 [SALE-GET-ALL] Buscando todas as vendas', { 
                page, 
                limit, 
                sortBy, 
                sortOrder, 
                startDate, 
                endDate, 
                personId, 
                minAmount, 
                maxAmount, 
                paymentMethodId, 
                licenseId, 
                otherFilters, 
                userId 
            });

            // Construir filtros
            const filters = {
                movement_type_id: 1, // Tipo "Venda"
                license_id: licenseId,
                ...otherFilters
            };

            // Adicionar filtros condicionais
            if (personId) filters.person_id = parseInt(personId);
            if (paymentMethodId) filters.payment_method_id = parseInt(paymentMethodId);
            
            // Filtros de data
            if (startDate || endDate) {
                filters.movement_date = {};
                if (startDate) filters.movement_date.gte = new Date(startDate);
                if (endDate) filters.movement_date.lte = new Date(endDate);
            }

            // Filtros de valor
            if (minAmount || maxAmount) {
                filters.total_amount = {};
                if (minAmount) filters.total_amount.gte = parseFloat(minAmount);
                if (maxAmount) filters.total_amount.lte = parseFloat(maxAmount);
            }

            // Configurar ordenação
            const sort = {
                field: sortBy,
                order: sortOrder.toLowerCase()
            };
            
            const result = await this.movementService.getAllMovements(
                filters,
                parseInt(page),
                parseInt(limit),
                sort,
                userId
            );
            
            logger.info('🟢 [SALE-FOUND-ALL] Todas as vendas encontradas', { result });
            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            logger.error('🔴 [SALE-GET-ALL-ERROR] Erro ao buscar todas as vendas', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error',
                message: error.message 
            });
        }
    }

    async updateSale(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            
            logger.info('🔵 [SALE-UPDATE] Atualizando venda', { id, userId });

            // Verificar se é uma venda
            const existingSale = await this.movementService.getMovementById(id, userId);
            if (existingSale.movement_type_id !== 1) {
                return res.status(404).json({ error: 'Sale not found' });
            }

            const sale = await this.movementService.updateMovement(id, req.body, userId);
            logger.info('🟢 [SALE-UPDATED] Venda atualizada', { sale });
            res.json(sale);
        } catch (error) {
            logger.error('🔴 [SALE-UPDATE-ERROR] Erro ao atualizar venda', error);
            if (error.message === 'Movement not found') {
                return res.status(404).json({ error: 'Sale not found' });
            }
            if (error.message.includes('must be greater than')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async deleteSale(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            
            logger.info('🔵 [SALE-DELETE] Deletando venda', { id, userId });

            // Verificar se é uma venda
            const existingSale = await this.movementService.getMovementById(id, userId);
            if (existingSale.movement_type_id !== 1) {
                return res.status(404).json({ error: 'Sale not found' });
            }

            await this.movementService.deleteMovement(id, userId);
            logger.info('🟢 [SALE-DELETED] Venda deletada', { id });
            res.status(204).send();
        } catch (error) {
            logger.error('🔴 [SALE-DELETE-ERROR] Erro ao deletar venda', error);
            if (error.message === 'Movement not found') {
                return res.status(404).json({ error: 'Sale not found' });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new SaleController();
