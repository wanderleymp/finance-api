const MovementPaymentRepository = require('../movement-payments/movement-payment.repository');
const MovementTypeRepository = require('../movement-types/movement-type.repository');
const MovementStatusRepository = require('../movement-statuses/movement-status.repository');
const InstallmentRepository = require('../installments/installment.repository');
const PersonRepository = require('../persons/person.repository'); 
const PaymentMethodRepository = require('../payment-methods/payment-method.repository');
const BillingMessageService = require('../messages/billing/billing-message.service');
const { logger } = require('../../middlewares/logger');
const { ValidationError } = require('../../utils/errors');
const IMovementService = require('./interfaces/IMovementService');
const MovementResponseDTO = require('./dto/movement-response.dto');
const MovementPaymentService = require('../movement-payments/movement-payment.service');
const BoletoRepository = require('../boletos/boleto.repository'); 
const LicenseRepository = require('../../repositories/licenseRepository'); 
const MovementItemRepository = require('../movement-items/movement-item.repository');
const ServiceRepository = require('../services/service-repository'); 
const NfseService = require('../nfse/nfse.service');
const N8nService = require('../../services/n8n.service'); // Corrigido import do N8N Service
const { systemDatabase } = require('../../config/database');

class MovementService extends IMovementService {
    constructor({ 
        movementRepository,
        personRepository,
        movementTypeRepository,
        movementStatusRepository,
        paymentMethodRepository,
        installmentRepository,
        movementPaymentService = null,
        personContactRepository,
        boletoService,
        movementPaymentRepository = null,
        installmentService,
        licenseRepository,
        movementItemRepository,
        nfseService,
        serviceRepository,
        billingMessageService,
        n8nService, // Adicionado parâmetro n8nService
        logger = console
    }) {
        super();
        
        // Fallback para movementRepository
        if (!movementRepository) {
            const MovementRepository = require('./movement.repository');
            movementRepository = new MovementRepository();
        }
        
        this.movementRepository = movementRepository;
        this.personRepository = personRepository;
        this.movementTypeRepository = movementTypeRepository;
        this.movementStatusRepository = movementStatusRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.installmentRepository = installmentRepository;
        
        // Fallback para movementPaymentService
        if (!movementPaymentService && movementPaymentRepository) {
            const MovementPaymentService = require('../movement-payments/movement-payment.service');
            movementPaymentService = new MovementPaymentService({
                movementPaymentRepository,
                installmentRepository,
                boletoService
            });
        }
        
        this.movementPaymentService = movementPaymentService;
        this.movementPaymentRepository = movementPaymentRepository;
        
        // Fallback para movementPaymentRepository
        if (!this.movementPaymentRepository) {
            const MovementPaymentRepository = require('../movement-payments/movement-payment.repository');
            this.movementPaymentRepository = new MovementPaymentRepository();
        }
        
        this.personContactRepository = personContactRepository;
        this.boletoService = boletoService;
        this.installmentService = installmentService;
        // Manter a lógica de fallback para criação do licenseRepository
        this.licenseRepository = licenseRepository || new LicenseRepository();
        
        // Fallback para movementItemRepository
        if (!movementItemRepository) {
            const MovementItemRepository = require('../movement-items/movement-item.repository');
            movementItemRepository = new MovementItemRepository();
        }
        this.movementItemRepository = movementItemRepository;
        
        this.nfseService = nfseService;
        this.serviceRepository = serviceRepository;
        this.billingMessageService = billingMessageService;
        
        // Fallback para n8nService
        if (!n8nService) {
            n8nService = require('../../services/n8n.service');
        }
        
        this.n8nService = n8nService; // Adicionado atributo n8nService
        
        this.pool = systemDatabase.pool;
        
        // Adicionar fallback para logger
        this.logger = logger;
    }

    /**
     * Busca movimento por ID
     */
    async getMovementById(id, detailed = false, include = []) {
        try {
            logger.info('Serviço: Buscando movimento por ID', { id, detailed, include });
            
            const data = await this.findById(id, true);

            if (!data) {
                throw new ValidationError('Movimento não encontrado');
            }

            return new MovementResponseDTO(data);
        } catch (error) {
            logger.error('Erro ao buscar movimento por ID no serviço', {
                error: error.message,
                movementId: id
            });
            throw error;
        }
    }

    /**
     * Busca um movimento por ID
     */
    async findById(id, detailed = false, include = '') {
        try {
            logger.info('Service: Buscando movimento por ID', { id, detailed, include });

            // Busca movimento base
            const movement = await this.movementRepository.findById(id, true);

            if (!movement) {
                logger.warn('Service: Movimento não encontrado', { id });
                return null;
            }

            // Log adicional para debug
            logger.info('Service: Movimento encontrado', { 
                movement_id: movement.movement_id, 
                movement_type_id: movement.movement_type_id,
                person_id: movement.person_id 
            });

            // Definir provider_id como o mesmo que person_id se não existir
            movement.provider_id = movement.provider_id || movement.person_id;

            // Log de debug para boletos
            if (movement.boletos) {
                logger.info('Service: Boletos encontrados', { 
                    boletosCount: movement.boletos.length,
                    boletoDetails: movement.boletos.map(b => ({
                        id: b.boleto_id, 
                        status: b.status
                    }))
                });
            }

            // Retorna movimento com todas as informações
            return {
                ...movement
            };
        } catch (error) {
            logger.error('Erro ao buscar movimento por ID', {
                error: error.message,
                movementId: id,
                error_stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Busca movimento por ID com detalhes
     * @param {number} id - ID do movimento
     * @returns {Promise<Object>} Movimento com detalhes
     */
    async findOne(id) {
        try {
            // Busca movimento pelo repositório
            const movement = await this.movementRepository.findById(id);
            
            if (!movement) {
                this.logger.warn('Movimento não encontrado', { movementId: id });
                throw new Error(`Movimento ${id} não encontrado`);
            }

            this.logger.info('Buscando detalhes da pessoa', {
                personId: movement.person_id,
                repositoryMethod: 'findPersonWithDetails'
            });

            const personRepository = new (require('../persons/person.repository'))();
            const personDetails = await personRepository.findPersonWithDetails(movement.person_id);

            this.logger.info('Detalhes encontrados', {
                movementId: movement.movement_id,
                personId: movement.person_id,
            });

            // Verifica se contacts existe e é um array antes de processar
            const contacts = personDetails.contacts || [];
            
            // Log adicional para detalhes de contatos
            this.logger.info('Detalhes de contatos', {
                totalContacts: contacts.length,
                contactTypes: contacts.map(c => c.type)
            });

            // Processa mensagem
            await this.billingMessageService.processBillingMessage(movement, personDetails, contacts);
            
            this.logger.info('Mensagem de faturamento enviada com sucesso', {
                movementId: movement.movement_id,
                personId: personDetails.person_id
            });

            return movement;
        } catch (error) {
            this.logger.error('Erro ao processar mensagem de faturamento', {
                error: error,
                errorMessage: error.message,
                errorStack: error.stack,
                movementId: id
            });
            throw error;
        }
    }

    /**
     * Lista movimentos com paginação e filtros
     * @param {Object} filters - Filtros para busca
     * @param {number} page - Número da página
     * @param {number} limit - Limite de itens por página
     * @param {boolean} detailed - Flag para busca detalhada
     * @returns {Promise<Object>} Lista paginada de movimentos
     */
    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            logger.info('Service: Iniciando busca de movimentos', { 
                page, 
                limit, 
                filters 
            });

            // Chama o repositório para buscar movimentos
            const result = await this.movementRepository.findAll(page, limit, filters);

            // Log de diagnóstico para boletos
            if (result.items) {
                const boletosCount = result.items.reduce((total, movement) => {
                    const movementBoletosCount = movement.boletos ? movement.boletos.length : 0;
                    return total + movementBoletosCount;
                }, 0);

                logger.info('Diagnóstico de boletos no serviço', {
                    totalMovements: result.items.length,
                    movementsWithBoletos: result.items.filter(m => m.boletos && m.boletos.length > 0).length,
                    totalBoletosCount: boletosCount,
                    boletosDetails: result.items.flatMap(movement => 
                        (movement.boletos || []).map(boleto => ({
                            movement_id: movement.movement_id,
                            boleto_id: boleto.boleto_id,
                            status: boleto.status
                        }))
                    )
                });
            }

            return result;
        } catch (error) {
            logger.error('Service: Erro ao buscar movimentos', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async create(data, client = null) {
        const executeTransaction = async (transactionClient) => {
            logger.info('Service: Criando novo movimento', { data });

            // Separar dados do movimento e do pagamento
            const { 
                items, 
                boleto = false, 
                nfse = false, 
                notificar = false, 
                due_date,
                ...movementData 
            } = data;

            // Validar dados do movimento
            const validatedData = this.validateMovementData(movementData);

            // Definir data do movimento se não fornecida
            validatedData.movement_date = validatedData.movement_date || new Date().toISOString().split('T')[0];
            
            // Definir status padrão se não fornecido
            validatedData.movement_status_id = validatedData.movement_status_id || 2; // Assumindo que 2 é o status padrão

            // Adicionar informações de boleto, notificação e data de vencimento
            validatedData.boleto = boleto;
            validatedData.nfse = nfse;
            validatedData.notificar = notificar;
            validatedData.due_date = due_date || new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0];

            // Criar movimento usando o cliente de transação
            const movement = await this.movementRepository.create(validatedData);
            logger.info('Service: Movimento criado', { movement });

            // Criar itens do movimento
            if (items && items.length > 0) {
                const MovementItemService = require('../movement-items/movement-item.service');
                const movementItemService = new MovementItemService();

                for (const item of items) {
                    try {
                        await movementItemService.create({
                            ...item,
                            movement_id: movement.movement_id
                        });
                    } catch (error) {
                        logger.error('Service: Erro ao criar item de movimento', {
                            error: error.message,
                            item,
                            movementId: movement.movement_id
                        });
                        throw error;
                    }
                }
            }

            // Após criar o movimento, envia mensagem de faturamento
            try {
                const person = await this.personRepository.findById(validatedData.person_id);

                // Cria pagamento se método de pagamento estiver presente
                if (validatedData.payment_method_id) {
                    const paymentData = {
                        payment_method_id: validatedData.payment_method_id,
                        total_amount: movement.total_amount,
                        movement_id: movement.movement_id,
                        person_id: validatedData.person_id
                    };

                    const payment = await this.createPayment(movement.movement_id, paymentData);
                    
                    logger.info('Service: Pagamento criado com sucesso', {
                        movementId: movement.movement_id,
                        paymentId: payment?.movement_payment_id
                    });
                }

                // Criar boleto se boleto for true
                if (boleto) {
                    await this.createBoletosMovimento(movement.movement_id);
                }

                // Notificar se notificar for true
                if (notificar) {
                    logger.info('Notificação solicitada para o movimento', { movementId: movement.movement_id });
                    // Implementar lógica de notificação
                }
            } catch (error) {
                logger.error('Erro ao processar pagamento ou mensagem de faturamento', {
                    error: error.message,
                    personId: validatedData.person_id
                });
                throw error;
            }

            return new MovementResponseDTO(movement);
        };

        // Se cliente for fornecido, usar o cliente, senão iniciar nova transação
        if (client) {
            return executeTransaction(client);
        } else {
            return this.movementPaymentRepository.transaction(executeTransaction);
        }
    }

    async createPayment(movementId, paymentData) {
        return this.movementPaymentRepository.transaction(async (client) => {
            logger.info('Service: Criando pagamento para movimento', { 
                movementId, 
                paymentData 
            });

            // Validações existentes
            if (!paymentData.payment_method_id) {
                logger.warn('Service: Método de pagamento não informado', {
                    paymentData: JSON.stringify(paymentData)
                });
                throw new ValidationError('Método de pagamento é obrigatório');
            }

            // Validar total_amount
            if (!paymentData.total_amount || paymentData.total_amount <= 0) {
                logger.warn('Service: Total de pagamento inválido', {
                    totalAmount: paymentData.total_amount,
                    paymentData: JSON.stringify(paymentData)
                });
                throw new ValidationError('Valor total do pagamento deve ser maior que zero');
            }

            // Validar movimento_id
            if (!paymentData.movement_id) {
                logger.warn('Service: Movimento não informado', {
                    paymentData: JSON.stringify(paymentData)
                });
                throw new ValidationError('Movimento é obrigatório');
            }

            const validatedData = {
                payment_method_id: paymentData.payment_method_id,
                total_amount: paymentData.total_amount,
                movement_id: paymentData.movement_id
            };

            // Adicionar campos opcionais
            if (paymentData.payment_date) {
                validatedData.payment_date = paymentData.payment_date;
            }

            if (paymentData.observation) {
                validatedData.observation = paymentData.observation;
            }

            logger.info('Service: Dados de pagamento validados com sucesso', {
                validatedData: JSON.stringify(validatedData)
            });

            try {
                const payment = await this.movementPaymentService.create({
                    ...validatedData, 
                    movement_id: movementId 
                });

                logger.info('Service: Pagamento criado com sucesso', { 
                    movementId, 
                    paymentId: payment.movement_payment_id,
                    paymentDetails: JSON.stringify(payment)
                });

                return payment;
            } catch (error) {
                logger.error('Service: Erro COMPLETO na criação de pagamento', {
                    movementId,
                    paymentData: JSON.stringify(validatedData),
                    errorMessage: error.message,
                    errorName: error.constructor.name,
                    errorStack: error.stack
                });
                throw error;
            }
        });
    }

    async createBoletosMovimento(movementId) {
        try {
            logger.info('Service: Criando boletos para movimento', { movementId });

            // Buscar parcelas do movimento
            const installments = await this.installmentRepository.findByMovementId(movementId);
            
            logger.info('Service: Parcelas encontradas', {
                movementId,
                quantidadeParcelas: installments.length,
                parcelas: installments.map(p => p.installment_id)
            });

            if (installments.length === 0) {
                logger.warn('Service: Nenhuma parcela encontrada para o movimento', { movementId });
                return [];
            }

            // Filtrar parcelas sem boleto
            const parcelasSemBoleto = [];
            for (const parcela of installments) {
                const query = 'SELECT COUNT(*) as count FROM boletos WHERE installment_id = $1';
                const result = await this.pool.query(query, [parcela.installment_id]);
                
                if (result.rows[0].count === '0') {
                    parcelasSemBoleto.push(parcela);
                }
            }

            if (parcelasSemBoleto.length === 0) {
                logger.info('Service: Todas as parcelas já possuem boleto', { movementId });
                return [];
            }

            // Criar boletos para parcelas sem boleto
            const boletos = [];
            for (const parcela of parcelasSemBoleto) {
                const boletoData = {
                    installment_id: parcela.installment_id,
                    status: 'A_EMITIR'
                };

                const boleto = await this.boletoService.createBoleto(boletoData);
                boletos.push(boleto);
            }

            logger.info('Service: Boletos criados com sucesso', { 
                movementId,
                quantidadeBoletos: boletos.length
            });

            return boletos;
        } catch (error) {
            logger.error('Erro ao criar boletos para movimento', {
                movementId,
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async cancelMovement(movementId) {
        // Verifica se o movimento existe
        const movement = await this.findById(movementId);
        if (!movement) {
            throw new ValidationError('Movimento não encontrado');
        }

        // Valida se o movimento já não está cancelado
        if (movement.movement_status_id === 99) {
            throw new ValidationError(`Movimento ${movementId} já está cancelado. Não é possível cancelar novamente.`);
        }

        // Atualiza status do movimento para 99 (cancelado)
        await this.movementRepository.update(movementId, { 
            movement_status_id: 99 
        });

        // Busca installments do movimento
        const installments = await this.installmentRepository.findByMovementId(movementId);
        
        logger.info('Parcelas encontradas para cancelamento', {
            movementId,
            installmentsCount: installments.length,
            installmentIds: installments.map(i => i.installment_id)
        });

        // Processamento assíncrono para cancelar boletos
        const cancelResults = await Promise.all(installments.map(async (installment) => {
            try {
                // Cancela boletos da parcela
                const canceledBoletos = await this.installmentService.cancelInstallmentBoletos(installment.installment_id);
                
                logger.info('Boletos cancelados da parcela', {
                    installmentId: installment.installment_id,
                    canceledBoletosCount: canceledBoletos.length
                });

                return {
                    installmentId: installment.installment_id,
                    canceledBoletosCount: canceledBoletos.length
                };
            } catch (error) {
                // Log de erro, mas não interrompe o processamento
                logger.error('Erro ao processar cancelamento de boletos da parcela', { 
                    installmentId: installment.installment_id, 
                    error: error.message 
                });

                return {
                    installmentId: installment.installment_id,
                    error: error.message
                };
            }
        }));

        return { 
            message: 'Movimento cancelado com sucesso', 
            movementId: movementId,
            cancelResults 
        };
    }

    async createMovementNFSe(movementId) {
        try {
            logger.info('Iniciando criação de NFSE para movimento', { movementId });
            
            const detailedMovement = await this.getDetailedMovement(movementId);
            
            const nfseResponse = await this.nfseService.emitirNfse(detailedMovement);
            
            logger.info('NFSE criada com sucesso para movimento', { 
                movementId, 
                movementDetails: {
                    movement_id: detailedMovement.movement.movement_id,
                    person_id: detailedMovement.person?.person_id,
                    total_items: detailedMovement.items?.length || 0
                },
                nfseResponse
            });

            return nfseResponse;
        } catch (error) {
            logger.error('Erro ao criar NFSE para movimento', { 
                movementId, 
                errorMessage: error.message 
            });
            throw error;
        }
    }

    async getMovementItems(movementId) {
        const movementItemsRepository = new (require('../movement-items/movement-item.repository'))();
        return await movementItemsRepository.findDetailedByMovementId(movementId);
    }

    /**
     * Busca movimento detalhado
     * @param {number} movementId - ID do movimento
     * @returns {Promise<Object>} Movimento detalhado
     */
    async getDetailedMovement(movementId) {
        try {
            console.log('Serviço getDetailedMovement chamado:', { movementId });
            
            const detailedMovement = await this.movementRepository.findDetailedMovement(movementId);

            if (!detailedMovement) {
                throw new ValidationError('Movimento não encontrado');
            }

            return detailedMovement;
        } catch (error) {
            logger.error('Erro detalhado ao buscar movimento detalhado:', {
                movementId,
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async sendBillingMessage(detailedMovement) {
        try {
            // Busca a pessoa associada ao movimento
            const person = await this.personRepository.findById(detailedMovement.person_id);

            // Busca os contatos da pessoa
            const contacts = await this.personContactRepository.findByPersonId(person.person_id);

            // Processa a mensagem de faturamento
            await this.billingMessageService.processBillingMessage(detailedMovement, person, contacts);
        } catch (error) {
            this.logger.error('Erro ao enviar mensagem de faturamento', {
                movementId: detailedMovement.movement_id,
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async update(id, data) {
        try {
            logger.info('Service: Atualizando movimento', { id, data });

            // Validar se movimento existe
            const movement = await this.movementRepository.findById(id);
            if (!movement) {
                throw new ValidationError('Movimento não encontrado');
            }

            // Validações específicas
            this.validateMovementData(data, true);

            // Atualizar movimento
            const updated = await this.movementRepository.update(id, data);

            return new MovementResponseDTO(updated);
        } catch (error) {
            logger.error('Service: Erro ao atualizar movimento', {
                error: error.message,
                id,
                data
            });
            throw error;
        }
    }

    async delete(id) {
        try {
            logger.info('Service: Removendo movimento', { id });

            // Validar se movimento existe
            const movement = await this.movementRepository.findById(id);
            if (!movement) {
                throw new ValidationError('Movimento não encontrado');
            }

            // Remover movimento
            await this.movementRepository.delete(id);
        } catch (error) {
            logger.error('Service: Erro ao remover movimento', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async updateStatus(id, status) {
        try {
            logger.info('Service: Atualizando status do movimento', { id, status });

            // Validar se movimento existe
            const movement = await this.movementRepository.findById(id);
            if (!movement) {
                throw new ValidationError('Movimento não encontrado');
            }

            // Validar transição de status
            this.validateStatusTransition(movement.status, status);

            // Atualizar status
            const updated = await this.movementRepository.updateStatus(id, status);

            return new MovementResponseDTO(updated);
        } catch (error) {
            logger.error('Service: Erro ao atualizar status do movimento', {
                error: error.message,
                id,
                status
            });
            throw error;
        }
    }

    async findMovementItemsByMovementId(movementId) {
        if (!movementId) {
            throw new ValidationError('Movement ID é obrigatório');
        }

        const movementItems = await this.movementItemRepository.find({
            where: { movement_id: movementId },
            relations: ['service', 'product'] // Adicione relações conforme necessário
        });

        return movementItems;
    }

    /**
     * Notifica faturamento de movimento via N8N
     * @param {number} movementId - ID do movimento a ser notificado
     * @returns {Promise<Object>} Resposta da notificação
     */
    async notifyBilling(movementId) {
        try {
            this.logger.info('Iniciando notificação de faturamento', {
                movementId,
                timestamp: new Date().toISOString()
            });

            // Verifica se o movimento existe
            const movement = await this.findOne(movementId);
            if (!movement) {
                throw new Error(`Movimento ${movementId} não encontrado`);
            }

            // Chama o serviço de notificação do N8N
            const notificationResult = await this.n8nService.notifyBillingMovement(movementId);

            this.logger.info('Notificação de faturamento concluída', {
                movementId,
                notificationResult,
                timestamp: new Date().toISOString()
            });

            return notificationResult;
        } catch (error) {
            this.logger.error('Erro na notificação de faturamento', {
                movementId,
                errorMessage: error.message,
                errorStack: error.stack,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    validateMovementData(data, isUpdate = false) {
        // Validações básicas se não for update
        if (!isUpdate) {
            if (!data.description) {
                throw new ValidationError('Descrição é obrigatória');
            }
            
            // Nova lógica de validação de valor
            const hasItems = data.items && data.items.length > 0;
            const hasTotalAmount = data.total_amount && data.total_amount > 0;
            
            if (!hasItems && !hasTotalAmount) {
                throw new ValidationError('Movimento deve ter itens ou valor total');
            }
            
            // Se tiver items, calcular valor total (opcional)
            if (hasItems) {
                const calculatedTotal = data.items.reduce((total, item) => 
                    total + (parseFloat(item.quantity) * parseFloat(item.unit_price)), 0);
                
                // Se total_amount existir, pode ser diferente do calculado
                if (hasTotalAmount && Math.abs(calculatedTotal - data.total_amount) > 0.01) {
                    this.logger.warn('Valor total diverge do valor calculado dos itens', {
                        calculatedTotal,
                        providedTotal: data.total_amount
                    });
                }
            }
            
            if (!data.person_id) {
                throw new ValidationError('Pessoa é obrigatória');
            }
            if (!data.movement_type_id) {
                throw new ValidationError('Tipo de movimento é obrigatório');
            }
            if (!data.movement_status_id) {
                throw new ValidationError('Status do movimento é obrigatório');
            }
            if (!data.license_id) {
                throw new ValidationError('Licença é obrigatória');
            }
        }

        // Validações para campos específicos em update
        if (data.total_amount !== undefined) {
            if (data.total_amount <= 0) {
                throw new ValidationError('Valor deve ser maior que zero');
            }
        }
        if (data.description !== undefined && data.description.length < 3) {
            throw new ValidationError('Descrição deve ter no mínimo 3 caracteres');
        }

        return data;
    }

    validateStatusTransition(currentStatus, newStatus) {
        const validStatus = ['PENDING', 'PAID', 'CANCELED'];
        if (!validStatus.includes(newStatus)) {
            throw new ValidationError('Status inválido');
        }

        // Regras de transição de status
        if (currentStatus === 'CANCELED') {
            throw new ValidationError('Não é possível alterar um movimento cancelado');
        }
        if (currentStatus === 'PAID' && newStatus !== 'CANCELED') {
            throw new ValidationError('Um movimento pago só pode ser cancelado');
        }
    }

    validateFilters(filters) {
        const { 
            value_min,
            value_max,
            movement_date_start,
            movement_date_end
        } = filters;

        // Valida range de valores
        if (value_min && value_max && parseFloat(value_min) > parseFloat(value_max)) {
            throw new ValidationError('O valor mínimo não pode ser maior que o valor máximo');
        }

        // Valida range de datas
        if (movement_date_start && movement_date_end) {
            const start = new Date(movement_date_start);
            const end = new Date(movement_date_end);
            if (start > end) {
                throw new ValidationError('A data inicial não pode ser maior que a data final');
            }
        }
    }

    prepareFilters(filters) {
        const preparedFilters = { ...filters };
        delete preparedFilters.detailed; // Remove o detailed dos filtros pois não é usado na query

        // Converte strings para números
        if (preparedFilters.person_id) {
            preparedFilters.person_id = parseInt(preparedFilters.person_id);
        }
        if (preparedFilters.movement_type_id) {
            preparedFilters.movement_type_id = parseInt(preparedFilters.movement_type_id);
        }
        if (preparedFilters.movement_status_id) {
            preparedFilters.movement_status_id = parseInt(preparedFilters.movement_status_id);
        }
        if (preparedFilters.value_min) {
            preparedFilters.value_min = parseFloat(preparedFilters.value_min);
        }
        if (preparedFilters.value_max) {
            preparedFilters.value_max = parseFloat(preparedFilters.value_max);
        }

        return preparedFilters;
    }

    async validatePaymentData(paymentData) {
        try {
            logger.info('Service: Iniciando validação de dados de pagamento', {
                paymentData: JSON.stringify(paymentData)
            });

            // Validações existentes
            if (!paymentData.payment_method_id) {
                logger.warn('Service: Método de pagamento não informado', {
                    paymentData: JSON.stringify(paymentData)
                });
                throw new ValidationError('Método de pagamento é obrigatório');
            }

            // Validar total_amount
            if (!paymentData.total_amount || paymentData.total_amount <= 0) {
                logger.warn('Service: Total de pagamento inválido', {
                    totalAmount: paymentData.total_amount,
                    paymentData: JSON.stringify(paymentData)
                });
                throw new ValidationError('Valor total do pagamento deve ser maior que zero');
            }

            // Validar movimento_id
            if (!paymentData.movement_id) {
                logger.warn('Service: Movimento não informado', {
                    paymentData: JSON.stringify(paymentData)
                });
                throw new ValidationError('Movimento é obrigatório');
            }

            const validatedData = {
                payment_method_id: paymentData.payment_method_id,
                total_amount: paymentData.total_amount,
                movement_id: paymentData.movement_id
            };

            // Adicionar campos opcionais
            if (paymentData.payment_date) {
                validatedData.payment_date = paymentData.payment_date;
            }

            if (paymentData.observation) {
                validatedData.observation = paymentData.observation;
            }

            logger.info('Service: Dados de pagamento validados com sucesso', {
                validatedData: JSON.stringify(validatedData)
            });

            return validatedData;
        } catch (error) {
            logger.error('Service: Erro na validação de dados de pagamento', {
                paymentData: JSON.stringify(paymentData),
                errorMessage: error.message,
                errorName: error.constructor.name,
                errorStack: error.stack
            });
            throw error;
        }
    }
}

module.exports = MovementService;
