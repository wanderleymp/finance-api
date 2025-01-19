const { logger } = require('../../middlewares/logger');
const { ValidationError, BadRequestError, InternalServerError } = require('../../utils/errors');
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
     * Valida os dados de pagamento antes da geração de parcelas
     * @private
     */
    _validatePaymentData(payment, paymentMethod, data) {
        // Verificação segura dos atributos do método de pagamento
        if (!paymentMethod) {
            throw new ValidationError('Método de pagamento não encontrado', {
                paymentMethodId: data.payment_method_id
            });
        }

        // Validações adicionais de segurança
        if (!payment || !payment.payment_id) {
            throw new ValidationError('Pagamento inválido', {
                payment: JSON.stringify(payment)
            });
        }

        // Verificar o tipo de documento de pagamento
        const isBoletoPagamento = paymentMethod.payment_document_type_id === 1;
        const installmentCount = paymentMethod.installment_count || 1;

        // Validar contagem de parcelas
        if (installmentCount <= 0) {
            throw new ValidationError('Número de parcelas inválido', {
                installmentCount,
                paymentMethodId: data.payment_method_id
            });
        }

        return {
            isBoletoPagamento,
            installmentCount
        };
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

    async create(data) {
        // Verificação de segurança para logger
        const safeLogger = this.logger || console;

        try {
            // Log ULTRA detalhado dos dados de entrada
            safeLogger.info('MovementPaymentService: Dados RAW de entrada', { 
                rawInputData: JSON.stringify(data),
                inputDataType: typeof data,
                inputDataKeys: data ? Object.keys(data) : 'N/A'
            });

            // Validações iniciais de dados de entrada
            if (!data || !data.movement_id || !data.payment_method_id || !data.total_amount) {
                safeLogger.warn('MovementPaymentService: Dados de pagamento INCOMPLETOS', { 
                    missingFields: {
                        movement_id: !data?.movement_id,
                        payment_method_id: !data?.payment_method_id,
                        total_amount: !data?.total_amount
                    },
                    receivedData: JSON.stringify(data)
                });

                throw new ValidationError('Dados de pagamento incompletos', { 
                    data,
                    missingFields: {
                        movement_id: !data?.movement_id,
                        payment_method_id: !data?.payment_method_id,
                        total_amount: !data?.total_amount
                    }
                });
            }

            // Log inicial detalhado
            safeLogger.info('MovementPaymentService: Iniciando criação de pagamento', { 
                inputData: JSON.stringify(data),
                paymentMethodId: data.payment_method_id,
                movementId: data.movement_id,
                totalAmount: data.total_amount,
                personId: data.person_id
            });

            // Criar payment
            const payment = await this.repository.create(data);
            
            safeLogger.info('MovementPaymentService: Movimento_payment criado', { 
                payment: JSON.stringify(payment),
                paymentId: payment.payment_id
            });

            // Buscar o payment method
            const paymentMethod = await this.paymentMethodsService.findById(data.payment_method_id);
            
            if (!paymentMethod) {
                safeLogger.error('MovementPaymentService: Método de pagamento NÃO ENCONTRADO', {
                    paymentMethodId: data.payment_method_id,
                    inputData: JSON.stringify(data)
                });

                throw new ValidationError('Método de pagamento não encontrado', {
                    paymentMethodId: data.payment_method_id
                });
            }

            safeLogger.info('MovementPaymentService: Payment method encontrado', { 
                paymentMethod: JSON.stringify(paymentMethod),
                paymentMethodId: data.payment_method_id,
                paymentMethodName: paymentMethod.method_name
            });

            return payment;
        } catch (mainError) {
            // Log de erro detalhado e seguro
            safeLogger.error('MovementPaymentService: Erro COMPLETO na criação de pagamento', {
                errorName: mainError?.constructor?.name || 'UnknownError',
                errorMessage: mainError?.message || 'Erro desconhecido',
                errorStack: mainError?.stack || 'Sem stack trace',
                inputData: JSON.stringify(data || {}),
                paymentMethodId: data?.payment_method_id,
                movementId: data?.movement_id,
                totalAmount: data?.total_amount
            });

            // Tratamento de erro mais robusto
            if (mainError instanceof ValidationError) {
                throw new BadRequestError(mainError.message);
            }

            throw new InternalServerError('Erro ao processar pagamento');
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

            // Verificação segura dos atributos do método de pagamento
            if (!paymentMethod) {
                throw new ValidationError('Método de pagamento não encontrado', {
                    paymentMethodId: data.payment_method_id
                });
            }

            // Validações adicionais de segurança
            if (!payment || !payment.payment_id) {
                throw new ValidationError('Pagamento inválido', {
                    payment: JSON.stringify(payment)
                });
            }

            // Verificar o tipo de documento de pagamento
            const isBoletoPagamento = paymentMethod.payment_document_type_id === 1;
            const installmentCount = paymentMethod.installment_count || 1;

            // Validar contagem de parcelas
            if (installmentCount <= 0) {
                throw new ValidationError('Número de parcelas inválido', {
                    installmentCount,
                    paymentMethodId: data.payment_method_id
                });
            }

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
            logger.error('Service: Erro na criação de movimento_payment', {
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
            // Validações iniciais de dados de entrada
            if (!data || !data.movement_id || !data.payment_method_id) {
                throw new ValidationError('Dados de pagamento incompletos', { 
                    data,
                    missingFields: {
                        movement_id: !data?.movement_id,
                        payment_method_id: !data?.payment_method_id
                    }
                });
            }

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

            // Validar dados de pagamento
            const { isBoletoPagamento, installmentCount } = this._validatePaymentData(payment, paymentMethod, data);

            // Geração de Parcelas com Tratamento de Erro Robusto
            let installments = [];
            try {
                if (isBoletoPagamento) {
                    // Se for boleto, usa o InstallmentGenerator que já cuida da criação do boleto
                    installments = await this._generateBoletoInstallments(payment, paymentMethod);
                } else {
                    // Para outros métodos de pagamento, gera parcelas padrão
                    installments = await this._generateStandardInstallments(payment, paymentMethod, data.total_amount);
                }
            } catch (installmentError) {
                this.logger.error('MovementPaymentService: Erro na geração de parcelas', {
                    errorName: installmentError.constructor.name,
                    errorMessage: installmentError.message,
                    errorStack: installmentError.stack,
                    paymentDetails: JSON.stringify(payment),
                    paymentMethodDetails: JSON.stringify(paymentMethod)
                });
                
                // Lançar erro personalizado
                throw new Error(`Falha na geração de parcelas: ${installmentError.message}`);
            }

            this.logger.info('Service: Parcelas geradas', { 
                installmentsCount: installments.length,
                paymentId: payment.payment_id 
            });

            return {
                ...payment,
                installments
            };
        } catch (mainError) {
            this.logger.error('MovementPaymentService: Erro COMPLETO na criação de pagamento', {
                errorName: mainError.constructor.name,
                errorMessage: mainError.message,
                errorStack: mainError.stack,
                inputData: JSON.stringify(data),
                paymentMethodId: data?.payment_method_id,
                movementId: data?.movement_id,
                totalAmount: data?.total_amount
            });

            throw mainError;
        }
    }

    // Novo método para determinar estratégia de geração de parcelas
    _determineInstallmentStrategy(paymentMethod) {
        // Lógica para determinar a estratégia de geração de parcelas
        const boletoPagamentoIds = [1]; // IDs de métodos de pagamento que são boletos
        
        if (boletoPagamentoIds.includes(paymentMethod.payment_method_id)) {
            return 'boleto';
        }
        
        return 'standard';
    }

    /**
     * Gera parcelas para boleto usando InstallmentGenerator
     * @private
     */
    async _generateBoletoInstallments(payment, paymentMethod) {
        try {
            const installments = await this.installmentGenerator.generateInstallments(payment, paymentMethod);
            
            this.logger.info('MovementPaymentService: Parcelas geradas via InstallmentGenerator', {
                installmentsCount: installments.length,
                installmentDetails: JSON.stringify(installments)
            });

            return installments;
        } catch (generatorError) {
            this.logger.error('MovementPaymentService: Erro no InstallmentGenerator', {
                errorMessage: generatorError.message,
                errorStack: generatorError.stack,
                paymentMethodDetails: JSON.stringify(paymentMethod)
            });
            throw generatorError;
        }
    }

    /**
     * Gera parcelas padrão para métodos de pagamento sem boleto
     * @private
     */
    async _generateStandardInstallments(payment, paymentMethod, totalAmount) {
        const installmentCount = paymentMethod.installment_count || 1;
        const installments = [];

        for (let i = 1; i <= installmentCount; i++) {
            const dueDate = new Date();
            dueDate.setMonth(dueDate.getMonth() + i - 1);

            this.logger.info('MovementPaymentService: Criando parcela', {
                paymentId: payment.payment_id,
                installmentNumber: i,
                installmentAmount: totalAmount / installmentCount,
                dueDate: dueDate.toISOString()
            });

            const installment = await this.installmentService.createInstallment({
                payment_id: payment.payment_id,
                installment_number: i,
                total_installments: installmentCount,
                amount: totalAmount / installmentCount,
                balance: totalAmount / installmentCount,
                due_date: dueDate.toISOString().split('T')[0],
                status: 'PENDING',
                account_entry_id: paymentMethod.account_entry_id
            });

            installments.push(installment);
        }

        return installments;
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
