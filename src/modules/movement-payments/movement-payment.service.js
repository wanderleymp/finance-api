const { logger } = require('../../middlewares/logger');
const { ValidationError } = require('../../utils/errors');
const IMovementPaymentService = require('./interfaces/IMovementPaymentService');
const { MovementPaymentResponseDTO } = require('./dto/movement-payment.dto');
const PaymentMethodService = require('../payment-methods/payment-method.service');
const InstallmentGenerator = require('../installments/installment.generator');
const InstallmentService = require('../installments/installment.service');
const InstallmentRepository = require('../installments/installment.repository');

class MovementPaymentService extends IMovementPaymentService {
    /**
     * @param {Object} params
     * @param {import('./movement-payment.repository')} params.movementPaymentRepository
     * @param {import('../installments/installment.repository')} params.installmentRepository
     * @param {import('../boletos/boleto.service')} params.boletoService
     */
    constructor({ 
        movementPaymentRepository,
        installmentRepository,
        boletoService
    }) {
        super();
        this.repository = movementPaymentRepository;
        this.installmentRepository = installmentRepository;
        this.boletoService = boletoService;
        
        // Inicializa outros serviços necessários
        const PaymentMethodRepository = require('../payment-methods/payment-method.repository');
        const paymentMethodRepository = new PaymentMethodRepository();

        this.paymentMethodsService = new PaymentMethodService({
            paymentMethodRepository,
        });
        
        // Instanciar o InstallmentService
        this.installmentService = new InstallmentService({ 
            installmentRepository,
        });
        
        // Inicializa o gerador de parcelas com o serviço de boleto
        if (!boletoService) {
            const BoletoService = require('../boletos/boleto.service');
            const N8nService = require('../../services/n8n.service');
            const n8nService = N8nService;
            const TaskService = require('../tasks/services/task.service');
            const TaskRepository = require('../tasks/repositories/task.repository');
            const taskRepository = new TaskRepository();
            const taskService = new TaskService({ taskRepository });
            boletoService = new BoletoService({
                boletoRepository: new (require('../boletos/boleto.repository'))(),
                n8nService,
                taskService
            });
            logger.info('MovementPaymentService: BoletoService criado automaticamente', {
                boletoServiceExists: !!boletoService
            });
            logger.debug('MovementPaymentService: BoletoService criado automaticamente - detalhes', {
                boletoService: boletoService
            });
        }

        logger.info('MovementPaymentService: Inicializando InstallmentGenerator', {
            boletoServiceExists: !!boletoService
        });

        this.installmentGenerator = new InstallmentGenerator(
            installmentRepository,
            boletoService
        );
    }

    /**
     * Lista pagamentos
     */
    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            logger.info('Serviço: Listando pagamentos', { page, limit, filters });

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

            const data = await this.repository.findById(id);
            if (!data) {
                return null;
            }
            return new MovementPaymentResponseDTO(data);
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
            // Log inicial detalhado
            this.logger.info('MovementPaymentService: Iniciando criação de pagamento', { 
                inputData: JSON.stringify(data),
                paymentMethodId: data.payment_method_id,
                movementId: data.movement_id,
                totalAmount: data.total_amount
            });

            // Criar payment
            const payment = await this.repository.create(data);
            
            this.logger.info('MovementPaymentService: Movimento_payment criado', { 
                payment: JSON.stringify(payment),
                paymentId: payment.payment_id
            });

            // Buscar o payment method para ver o número de parcelas
            const paymentMethod = await this.paymentMethodsService.findById(data.payment_method_id);
            
            this.logger.info('MovementPaymentService: Payment method encontrado', { 
                paymentMethod: JSON.stringify(paymentMethod),
                paymentMethodId: data.payment_method_id 
            });

            // Log antes da geração de parcelas
            this.logger.info('MovementPaymentService: Preparando geração de parcelas', {
                paymentMethodInstallments: paymentMethod.installment_count,
                totalAmount: data.total_amount
            });

            // Gerar parcelas
            let installments = [];
            
            // Verificação segura dos atributos do método de pagamento
            if (!paymentMethod) {
                throw new ValidationError('Método de pagamento não encontrado', {
                    paymentMethodId: data.payment_method_id
                });
            }

            // Verificar o tipo de documento de pagamento
            const isBoletoPagamento = paymentMethod.payment_document_type_id === 1;
            const installmentCount = paymentMethod.installment_count || 1;

            if (isBoletoPagamento) {
                // Se for boleto, usa o InstallmentGenerator que já cuida da criação do boleto
                installments = await this.installmentGenerator.generateInstallments(payment, paymentMethod);
            } else {
                // Para outros métodos de pagamento, usa o InstallmentService
                const installmentAmount = data.total_amount / installmentCount;
                
                for (let i = 1; i <= installmentCount; i++) {
                    const dueDate = new Date();
                    dueDate.setMonth(dueDate.getMonth() + i - 1);

                    const installment = await this.installmentService.createInstallment({
                        payment_id: payment.payment_id,
                        installment_number: i,
                        total_installments: installmentCount,
                        amount: installmentAmount,
                        balance: installmentAmount,
                        due_date: dueDate.toISOString().split('T')[0],
                        status: 'PENDING',
                        account_entry_id: paymentMethod.account_entry_id
                    });

                    installments.push(installment);
                }
            }

            logger.info('Service: Parcelas geradas', { 
                installmentsCount: installments.length,
                paymentId: payment.payment_id 
            });

            return {
                ...payment,
                installments
            };
        } catch (error) {
            this.logger.error('MovementPaymentService: Erro COMPLETO na criação de pagamento', {
                inputData: JSON.stringify(data),
                errorMessage: error.message,
                errorName: error.constructor.name,
                errorStack: error.stack,
                paymentMethodId: data.payment_method_id,
                movementId: data.movement_id,
                totalAmount: data.total_amount
            });
            throw error;
        }
    }

    /**
     * Cria um novo pagamento dentro de uma transação
     */
    async createWithTransaction(client, data) {
        try {
            logger.info('Service: Criando movimento_payment', { 
                data,
                timestamp: new Date().toISOString()
            });

            // Validar dados de entrada
            if (!data.movement_id || !data.payment_method_id || !data.total_amount) {
                throw new ValidationError('Dados de pagamento incompletos', {
                    movement_id: data.movement_id,
                    payment_method_id: data.payment_method_id,
                    total_amount: data.total_amount
                });
            }

            // Criar payment
            const payment = await this.repository.createWithClient(client, data);
            logger.info('Service: Movimento_payment criado', { 
                payment,
                timestamp: new Date().toISOString()
            });

            // Buscar o payment method para ver o número de parcelas
            const paymentMethod = await this.paymentMethodsService.findById(data.payment_method_id);
            logger.info('Service: Payment method encontrado', { 
                paymentMethod,
                timestamp: new Date().toISOString()
            });

            // Buscar o movimento para pegar o person_id
            const movement = await this.repository.findMovementById(data.movement_id);
            logger.info('Service: Movimento encontrado', { 
                movement,
                timestamp: new Date().toISOString()
            });

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
                const installmentAmount = Number(data.total_amount) / (paymentMethod.data.installment_count || 1);
                
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

            logger.info('Service: Parcelas geradas', { 
                installmentsCount: installments.length,
                paymentId: payment.payment_id,
                timestamp: new Date().toISOString()
            });

            return {
                ...payment,
                installments
            };
        } catch (error) {
            logger.error('Service: Erro COMPLETO na criação de movimento_payment', {
                inputData: JSON.stringify(data),
                errorMessage: error.message,
                errorName: error.constructor.name,
                errorStack: error.stack,
                paymentMethodId: data.payment_method_id,
                movementId: data.movement_id,
                totalAmount: data.total_amount,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    /**
     * Cria um novo pagamento
     */
    async createPayment(data) {
        try {
            this.logger.info('Criando pagamento de movimento', { 
                data,
                timestamp: new Date().toISOString()
            });

            // Remover parâmetros extras antes da validação
            const { generateBoleto, due_date, ...validationData } = data;

            // Validar dados do pagamento
            const validatedData = {
                ...MovementPaymentCreateDTO.validate(validationData),
                generateBoleto: generateBoleto || false,
                due_date: due_date || new Date().toISOString().split('T')[0]
            };

            // Criar pagamento no repositório
            const payment = await this.repository.create(validatedData);

            // Criar parcelas do pagamento
            const installments = await this.createInstallments(
                payment.movement_payment_id, 
                validatedData.generateBoleto,
                validatedData.due_date
            );

            // Adicionar parcelas ao pagamento
            payment.installments = installments;

            this.logger.info('Pagamento de movimento criado com sucesso', { 
                movementPaymentId: payment.movement_payment_id,
                generateBoleto: validatedData.generateBoleto,
                dueDate: validatedData.due_date,
                timestamp: new Date().toISOString()
            });

            return payment;
        } catch (error) {
            this.logger.error('Erro ao criar pagamento de movimento', {
                data,
                errorMessage: error.message,
                errorName: error.constructor.name,
                errorStack: error.stack,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    async createInstallments(movementPaymentId, generateBoleto = false, due_date = null) {
        try {
            this.logger.info('Criando parcelas do pagamento', { 
                movementPaymentId, 
                generateBoleto,
                due_date,
                timestamp: new Date().toISOString()
            });

            const installments = await this.installmentService.createInstallments({
                movement_payment_id: movementPaymentId,
                generateBoleto,
                due_date  // Passar due_date para createInstallments
            });

            return installments;
        } catch (error) {
            this.logger.error('Erro ao criar parcelas do pagamento', {
                movementPaymentId,
                errorMessage: error.message,
                errorStack: error.stack,
                timestamp: new Date().toISOString()
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
