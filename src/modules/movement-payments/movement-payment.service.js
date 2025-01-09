const { logger } = require('../../middlewares/logger');
const { ValidationError } = require('../../utils/errors');
const IMovementPaymentService = require('./interfaces/IMovementPaymentService');
const { MovementPaymentResponseDTO } = require('./dto/movement-payment.dto');
const PaymentMethodsService = require('../../services/paymentMethodsService');
const InstallmentGenerator = require('../installments/installment.generator');
const InstallmentService = require('../installments/installment.service');
const InstallmentRepository = require('../installments/installment.repository');

class MovementPaymentService extends IMovementPaymentService {
    /**
     * @param {Object} params
     * @param {import('./movement-payment.repository')} params.movementPaymentRepository
     * @param {import('../../services/cache.service')} params.cacheService
     * @param {import('../installments/installment.repository')} params.installmentRepository
     * @param {import('../boletos/boleto.service')} params.boletoService
     */
    constructor({ 
        movementPaymentRepository,
        cacheService,
        installmentRepository,
        boletoService
    }) {
        super();
        this.repository = movementPaymentRepository;
        this.cacheService = cacheService;
        this.installmentRepository = installmentRepository;
        this.boletoService = boletoService;
        
        // Inicializa outros serviços necessários
        this.paymentMethodsService = new PaymentMethodsService();
        
        // Instanciar o InstallmentService
        this.installmentService = new InstallmentService({ 
            installmentRepository,
            cacheService
        });
        
        // Inicializa o gerador de parcelas com o serviço de boleto
        this.installmentGenerator = new InstallmentGenerator(
            installmentRepository,
            boletoService
        );
        
        this.cachePrefix = 'movement-payments';
        this.cacheTTL = {
            list: 300, // 5 minutos
            detail: 600 // 10 minutos
        };
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
     * Busca pagamentos por ID de movimento
     * @param {number} movementId - ID do movimento
     * @param {boolean} [detailed=false] - Se deve carregar detalhes
     * @returns {Promise<Array>} Lista de pagamentos
     */
    async findByMovementId(movementId, detailed = false) {
        try {
            logger.info('Serviço: Buscando pagamentos por movimento ID', { movementId, detailed });

            const cacheKey = this.cacheService.generateKey(`${this.cachePrefix}:movement`, { movementId, detailed });

            const payments = await this.cacheService.getOrSet(
                cacheKey,
                async () => {
                    logger.info('Serviço: Buscando dados de pagamentos', { movementId });
                    const data = await this.repository.findByMovementId(movementId);
                    
                    logger.info('Serviço: Pagamentos encontrados', { 
                        count: data.length, 
                        paymentIds: data.map(p => p.payment_id) 
                    });

                    if (!detailed) {
                        return data.map(payment => new MovementPaymentResponseDTO(payment));
                    }

                    // Se detailed, carrega installments
                    const paymentsWithDetails = await Promise.all(
                        data.map(async (payment) => {
                            logger.info('Serviço: Carregando detalhes para pagamento', { 
                                payment_id: payment.payment_id 
                            });

                            try {
                                const installments = await this.installmentRepository.findByPaymentId(payment.payment_id);

                                logger.info('Serviço: Detalhes carregados', { 
                                    payment_id: payment.payment_id,
                                    installments_count: installments.length
                                });

                                return new MovementPaymentResponseDTO({
                                    ...payment,
                                    installments
                                });
                            } catch (error) {
                                logger.error('Erro ao carregar detalhes do pagamento', {
                                    error: error.message,
                                    payment_id: payment.payment_id
                                });
                                return new MovementPaymentResponseDTO(payment);
                            }
                        })
                    );

                    return paymentsWithDetails;
                },
                this.cacheTTL.detail
            );

            return payments;
        } catch (error) {
            logger.error('Erro ao buscar pagamentos por movimento ID', {
                error: error.message,
                movementId,
                detailed,
                error_stack: error.stack
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

            // Gerar parcelas
            let installments = [];
            if (paymentMethod.type === 'BOLETO') {
                // Se for boleto, usa o InstallmentGenerator que já cuida da criação do boleto
                installments = await this.installmentGenerator.generateInstallments(payment, paymentMethod);
            } else {
                // Para outros métodos de pagamento, usa o InstallmentService
                const installmentAmount = data.total_amount / (paymentMethod.max_installments || 1);
                
                for (let i = 1; i <= (paymentMethod.max_installments || 1); i++) {
                    const dueDate = new Date();
                    dueDate.setMonth(dueDate.getMonth() + i - 1);

                    const installment = await this.installmentService.createInstallment({
                        payment_id: payment.payment_id,
                        installment_number: i,
                        total_installments: paymentMethod.max_installments,
                        amount: installmentAmount,
                        balance: installmentAmount,
                        due_date: dueDate.toISOString().split('T')[0],
                        status: 'PENDING',
                        account_entry_id: paymentMethod.data.account_entry_id
                    });

                    installments.push(installment);
                }
            }

            logger.info('Service: Parcelas geradas', { installments });

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
     * Cria um novo pagamento dentro de uma transação
     */
    async createWithTransaction(client, data) {
        try {
            logger.info('Service: Criando movimento_payment', { data });

            // Criar payment
            const payment = await this.repository.createWithClient(client, data);
            logger.info('Service: Movimento_payment criado', { payment });

            // Buscar o payment method para ver o número de parcelas
            const paymentMethod = await this.paymentMethodsService.findById(data.payment_method_id);
            logger.info('Service: Payment method encontrado', { paymentMethod });

            // Buscar o movimento para pegar o person_id
            const movement = await this.repository.findMovementById(data.movement_id);
            logger.info('Service: Movimento encontrado', { movement });

            // Gerar parcelas
            let installments = [];
            if (paymentMethod.data.payment_document_type_id === 1) {
                // Se for boleto, usa o InstallmentGenerator que já cuida da criação do boleto
                installments = await this.installmentGenerator.generateInstallmentsWithTransaction(client, {
                    ...payment,
                    person_id: movement.person_id,
                    description: movement.description
                }, paymentMethod);
            } else {
                // Para outros métodos de pagamento, usa o InstallmentService
                const installmentAmount = data.total_amount / (paymentMethod.data.installment_count || 1);
                
                for (let i = 1; i <= (paymentMethod.data.installment_count || 1); i++) {
                    const dueDate = new Date();
                    dueDate.setMonth(dueDate.getMonth() + i - 1);

                    const installment = await this.installmentService.createInstallmentWithTransaction(client, {
                        payment_id: payment.payment_id,
                        installment_number: i,
                        total_installments: paymentMethod.data.installment_count,
                        amount: installmentAmount,
                        balance: installmentAmount,
                        due_date: dueDate.toISOString().split('T')[0],
                        status: 'PENDING',
                        account_entry_id: paymentMethod.data.account_entry_id
                    });

                    installments.push(installment);
                }
            }

            logger.info('Service: Parcelas geradas', { installments });

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
