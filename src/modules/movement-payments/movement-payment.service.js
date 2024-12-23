const { logger } = require('../../middlewares/logger');
const { ValidationError } = require('../../utils/errors');
const IMovementPaymentService = require('./interfaces/IMovementPaymentService');
const { MovementPaymentResponseDTO } = require('./dto/movement-payment.dto');
const PaymentMethodsService = require('../../services/paymentMethodsService');
const InstallmentService = require('../../services/installmentService');

class MovementPaymentService extends IMovementPaymentService {
    /**
     * @param {Object} params
     * @param {import('./movement-payment.repository')} params.movementPaymentRepository
     * @param {import('../../services/cache.service')} params.cacheService
     */
    constructor({ movementPaymentRepository, cacheService }) {
        super();
        this.repository = movementPaymentRepository;
        this.cacheService = cacheService;
        this.cachePrefix = 'movement-payments';
        this.cacheTTL = {
            list: 300, // 5 minutos
            detail: 600 // 10 minutos
        };

        // Inicializa outros serviços necessários
        this.paymentMethodsService = new PaymentMethodsService({});
        this.installmentService = new InstallmentService();
    }

    /**
     * Lista pagamentos
     */
    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            logger.info('Serviço: Listando pagamentos', { page, limit, filters });

            const cacheKey = this.cacheService.generateKey(`${this.cachePrefix}:list`, { page, limit, filters });

            const result = await this.cacheService.getOrSet(
                cacheKey,
                async () => {
                    const data = await this.repository.findAll(page, limit, filters);
                    return {
                        data: data.rows.map(row => new MovementPaymentResponseDTO(row)),
                        pagination: {
                            page: parseInt(page),
                            limit: parseInt(limit),
                            total: parseInt(data.count),
                            total_pages: Math.ceil(data.count / limit)
                        }
                    };
                },
                this.cacheTTL.list
            );

            return result;
        } catch (error) {
            logger.error('Erro ao listar pagamentos no serviço', {
                error: error.message,
                page,
                limit,
                filters
            });
            throw error;
        }
    }

    /**
     * Busca pagamento por ID
     */
    async findById(id) {
        try {
            logger.info('Serviço: Buscando pagamento por ID', { id });
            
            const cacheKey = this.cacheService.generateKey(`${this.cachePrefix}:detail`, { id });

            const payment = await this.cacheService.getOrSet(
                cacheKey,
                async () => {
                    const data = await this.repository.findById(id);
                    if (!data) {
                        return null;
                    }
                    return new MovementPaymentResponseDTO(data);
                },
                this.cacheTTL.detail
            );
            
            return payment;
        } catch (error) {
            logger.error('Erro ao buscar pagamento por ID no serviço', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    /**
     * Cria um novo pagamento
     */
    async create(data) {
        try {
            logger.info('Service: Criando movimento_payment', { data });

            // Criar payment
            const payment = await this.repository.create(data);
            logger.info('Service: Movimento_payment criado', { payment });

            // Buscar o payment method para ver o número de parcelas
            const paymentMethod = await this.paymentMethodsService.findById(data.payment_method_id);
            logger.info('Service: Payment method encontrado', { paymentMethod });

            // Criar installments
            const installmentAmount = data.total_amount / (paymentMethod.installments || 1);
            const installments = [];

            for (let i = 0; i < (paymentMethod.installments || 1); i++) {
                const dueDate = new Date();
                dueDate.setMonth(dueDate.getMonth() + i);

                const installment = await this.installmentService.create({
                    payment_id: payment.payment_id,
                    installment_number: i + 1,
                    amount: installmentAmount,
                    due_date: dueDate.toISOString().split('T')[0],
                    status: 'PENDING'
                });

                installments.push(installment);
            }

            logger.info('Service: Installments criados', { installments });

            return {
                ...payment,
                installments
            };
        } catch (error) {
            logger.error('Service: Erro ao criar movimento_payment', {
                error: error.message,
                error_stack: error.stack,
                data
            });
            throw error;
        }
    }

    /**
     * Atualiza um pagamento
     */
    async update(id, data) {
        try {
            logger.info('Serviço: Atualizando pagamento', { id, data });

            const result = await this.repository.update(id, data);
            if (!result) {
                return null;
            }

            await this.cacheService.invalidatePrefix(this.cachePrefix);
            return new MovementPaymentResponseDTO(result);
        } catch (error) {
            logger.error('Erro ao atualizar pagamento no serviço', {
                error: error.message,
                id,
                data
            });
            throw error;
        }
    }

    /**
     * Remove um pagamento
     */
    async delete(id) {
        try {
            logger.info('Serviço: Removendo pagamento', { id });

            const result = await this.repository.delete(id);
            if (!result) {
                return null;
            }

            await this.cacheService.invalidatePrefix(this.cachePrefix);
            return result;
        } catch (error) {
            logger.error('Erro ao remover pagamento no serviço', {
                error: error.message,
                id
            });
            throw error;
        }
    }
}

module.exports = MovementPaymentService;
