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

    async create(data, client = null) {
        try {
            logger.info('Service: Iniciando criação de pagamento', { data });

            // Validar dados do pagamento
            if (!data.movement_id) {
                throw new ValidationError('ID do movimento é obrigatório');
            }
            // Validações básicas
            if (!data.total_amount) {
                throw new ValidationError('Valor total é obrigatório');
            }

            // Método de pagamento é opcional
            let paymentMethod = null;
            if (data.payment_method_id) {
                paymentMethod = await this.paymentMethodsService.findById(data.payment_method_id);
                if (!paymentMethod) {
                    throw new ValidationError('Método de pagamento não encontrado', {
                        paymentMethodId: data.payment_method_id
                    });
                }
            }

            // Criar pagamento usando o cliente de transação
            const paymentData = {
                movement_id: data.movement_id,
                payment_method_id: data.payment_method_id,
                total_amount: data.total_amount
            };

            const payment = client 
                ? await this.repository.createWithClient(client, paymentData)
                : await this.repository.create(paymentData);

            // Gerar parcelas apenas se houver método de pagamento
            let installments = [];
            
            if (!paymentMethod) {
                logger.info('Pagamento criado sem método de pagamento - pulando geração de parcelas', {
                    payment_id: payment.payment_id
                });
                return payment;
            }

            // Verificar o tipo de documento de pagamento
            const isBoletoPagamento = paymentMethod.payment_document_type_id === 1;
            const installmentCount = paymentMethod.installment_count || 1;

            // Usar due_date apenas se fornecido
            const baseDueDate = data.due_date ? new Date(data.due_date) : null;

            if (isBoletoPagamento && data.generateBoleto) {
                // Se for boleto, usa o InstallmentGenerator que já cuida da criação do boleto
                installments = await this.installmentGenerator.generateInstallments(payment, paymentMethod, baseDueDate, data.generateBoleto, client);
            } else {
                // Para outros métodos de pagamento, usa o InstallmentService
                const installmentAmount = data.total_amount / installmentCount;
                
                for (let i = 1; i <= installmentCount; i++) {
                    const dueDate = new Date(baseDueDate);
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
                    }, client);

                    installments.push(installment);
                }
            }

            logger.info('Service: Parcelas geradas', { 
                installmentsCount: installments.length,
                paymentId: payment.payment_id,
                baseDueDate: baseDueDate ? baseDueDate.toISOString() : null
            });

            return {
                ...payment,
                installments
            };
        } catch (error) {
            logger.error('Service: Erro ao criar pagamento', {
                error: error.message,
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

            // Validar contagem de parcelas
            const installmentCount = paymentMethod.installment_count || 1;

            // Validar dados de pagamento
            if (!payment || !payment.payment_id) {
                throw new ValidationError('Pagamento inválido', {
                    payment: JSON.stringify(payment)
                });
            }

            // Verificar método de pagamento
            logger.debug('MovementPaymentService: Detalhes do Método de Pagamento', {
                paymentMethodId: data.payment_method_id,
                paymentMethodDetails: JSON.stringify(paymentMethod),
                installmentCount: paymentMethod?.installments_number || 'NÃO DEFINIDO'
            });

            // Determinar número de parcelas
            logger.debug('MovementPaymentService: Configuração de Parcelas', {
                installmentCount,
                totalAmount: data.total_amount,
                paymentMethodId: data.payment_method_id
            });

            // Validar dados de pagamento
            if (!paymentMethod) {
                logger.error('MovementPaymentService: Método de pagamento não encontrado', {
                    paymentMethodId: data.payment_method_id
                });
                throw new Error('Método de pagamento não encontrado');
            }

            // Verificar se é boleto
            const isBoletoPagamento = paymentMethod.is_boleto || false;
            
            logger.debug('MovementPaymentService: Configuração de Boleto', {
                isBoletoPagamento,
                paymentMethodDetails: JSON.stringify(paymentMethod)
            });

            // Gerar parcelas
            let installments = [];
            // Verificação segura dos atributos do método de pagamento
            logger.debug('MovementPaymentService: Iniciando geração de parcelas', {
                isBoletoPagamento,
                installmentCount,
                paymentMethodId: paymentMethod.payment_method_id,
                totalAmount: data.total_amount
            });

            // Verificar o tipo de documento de pagamento
            const isBoletoPagamento2 = paymentMethod.payment_document_type_id === 1;
            const installmentCount2 = paymentMethod.installment_count || 1;

            // Validar contagem de parcelas
            if (installmentCount2 <= 0) {
                throw new ValidationError('Número de parcelas inválido', {
                    installmentCount: installmentCount2,
                    paymentMethodId: data.payment_method_id
                });
            }

            // Gerar parcelas
            if (isBoletoPagamento2) {
                // Se for boleto, usa o InstallmentGenerator que já cuida da criação do boleto
                installments = await this.installmentGenerator.generateInstallments(payment, paymentMethod);
            } else {
                // Para outros métodos de pagamento, usa o InstallmentService
                const installmentAmount = data.total_amount / installmentCount2;
                
                for (let i = 1; i <= installmentCount2; i++) {
                    const dueDate = new Date();
                    dueDate.setMonth(dueDate.getMonth() + i - 1);

                    const installment = await this.installmentService.createInstallment({
                        payment_id: payment.payment_id,
                        installment_number: i,
                        total_installments: installmentCount2,
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
    async createPayment(data, options = {}) {
        try {
            const { generateBoleto = true } = options;

            // Log de início do método
            logger.info('MovementPaymentService: INÍCIO da criação de pagamento', { 
                inputData: JSON.stringify(data),
                timestamp: new Date().toISOString()
            });

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
            logger.info('MovementPaymentService: Iniciando criação de pagamento', { 
                inputData: JSON.stringify(data),
                paymentMethodId: data.payment_method_id,
                movementId: data.movement_id,
                totalAmount: data.total_amount
            });

            // Criar payment
            const payment = await this.repository.create(data);
            
            logger.info('MovementPaymentService: Movimento_payment criado', { 
                payment: JSON.stringify(payment),
                paymentId: payment.payment_id
            });

            // Buscar o payment method para ver o número de parcelas
            const paymentMethod = await this.paymentMethodsService.findById(data.payment_method_id);
            
            logger.info('MovementPaymentService: Payment method encontrado', { 
                paymentMethod: JSON.stringify(paymentMethod),
                paymentMethodId: data.payment_method_id 
            });

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
            if (isBoletoPagamento && generateBoleto) {
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

            // Log de fim do método
            logger.info('MovementPaymentService: FIM da criação de pagamento', { 
                paymentId: payment.payment_id,
                installmentsCount: installments.length,
                timestamp: new Date().toISOString()
            });

            return {
                ...payment,
                installments
            };
        } catch (error) {
            // Log de erro com detalhes
            logger.error('MovementPaymentService: ERRO na criação de pagamento', {
                error: error.message,
                error_stack: error.stack,
                inputData: data,
                paymentMethodId: data?.payment_method_id,
                timestamp: new Date().toISOString()
            });

            // Erros genéricos
            if (error.message.includes('payment_method_id')) {
                throw new ValidationError('Método de pagamento inválido', {
                    paymentMethodId: data?.payment_method_id
                });
            }

            // Erro genérico para o frontend
            throw new Error('Erro ao processar pagamento. Por favor, tente novamente.');
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
