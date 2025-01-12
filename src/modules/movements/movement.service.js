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
const BoletoRepository = require('../boletos/boleto.repository'); // Adicionado o BoletoRepository
const LicenseRepository = require('../../repositories/licenseRepository');
const MovementItemRepository = require('../movement-items/movement-item.repository');
const ServiceRepository = require('../services/service.repository'); // Adicionado o ServiceRepository

class MovementService extends IMovementService {
    constructor({ 
        movementRepository,
        personRepository,
        movementTypeRepository,
        movementStatusRepository,
        cacheService,
        paymentMethodRepository,
        installmentRepository,
        movementPaymentService,
        personContactRepository,
        boletoRepository,
        boletoService, // Adicionar boletoService
        movementPaymentRepository, // Adicionando este parâmetro
        installmentService, // Adicionar installmentService
        licenseRepository, // Adicionar licenseRepository
        movementItemRepository, // Adicionar movementItemRepository
        nfseService, // Adicionar nfseService
        serviceRepository // Adicionar serviceRepository
    }) {
        super();
        
        this.movementRepository = movementRepository;
        this.personRepository = personRepository;
        this.movementTypeRepository = movementTypeRepository;
        this.movementStatusRepository = movementStatusRepository;
        this.cacheService = cacheService;
        this.paymentMethodRepository = paymentMethodRepository;
        this.installmentRepository = installmentRepository;
        this.movementPaymentService = movementPaymentService;
        this.personContactRepository = personContactRepository;
        this.boletoRepository = boletoRepository;
        this.boletoService = boletoService; // Adicionar atribuição
        this.movementPaymentRepository = movementPaymentRepository; // Adicionando esta linha
        this.installmentService = installmentService; // Adicionar atribuição
        this.licenseRepository = licenseRepository; // Adicionar atribuição
        this.movementItemRepository = movementItemRepository; // Adicionar atribuição
        this.nfseService = nfseService; // Adicionar atribuição
        this.serviceRepository = serviceRepository; // Adicionar atribuição
        this.billingMessageService = new BillingMessageService();

        this.cachePrefix = 'movements';
        this.cacheTTL = {
            list: 5 * 60, // 5 minutos
            detail: 15 * 60 // 15 minutos
        };
    }

    /**
     * Busca movimento por ID
     */
    async getMovementById(id, detailed = false, include = []) {
        try {
            logger.info('Serviço: Buscando movimento por ID', { id, detailed, include });
            
            let movement;
            const cacheKey = this.cacheService?.generateKey(
                `${this.cachePrefix}:${detailed ? 'detail' : 'basic'}`, 
                { id }
            );
            
            if (this.cacheService) {
                movement = await this.cacheService.get(cacheKey);
                
                if (movement) {
                    logger.info('Service: Retornando movimento do cache', { id });
                    return movement;
                }
            }

            const data = await this.findById(id, true);

            if (!data) {
                throw new ValidationError('Movimento não encontrado');
            }

            movement = new MovementResponseDTO(data);

            if (this.cacheService) {
                await this.cacheService.set(
                    cacheKey, 
                    movement, 
                    true ? this.cacheTTL.detail : this.cacheTTL.list
                );
            }
            
            return movement;
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

            // Busca pagamentos com installments e boletos
            const payments = await this.movementPaymentService.findByMovementId(movement.movement_id, true);

            // Calcula totais
            const total_paid = payments
                .filter(p => p.status_id === 2)
                .reduce((sum, p) => sum + p.amount, 0);

            const total_value = payments.reduce((sum, p) => sum + p.amount, 0);
            const remaining_amount = total_value - total_paid;

            // Retorna movimento com todas as informações
            return {
                ...movement,
                payments: payments,
                total_paid,
                total_value,
                remaining_amount
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
                logger.warn('Movimento não encontrado', { movementId: id });
                return null;
            }

            // Busca pessoa do movimento
            const person = await this.personRepository.findById(movement.person_id);
            
            // Adiciona pessoa ao movimento
            movement.person = person;

            // Busca outros detalhes se necessário
            // Por exemplo, installments, payments, etc.

            logger.info('Movimento encontrado', { 
                movementId: id,
                personId: person?.person_id 
            });

            return movement;
        } catch (error) {
            logger.error('Erro ao buscar movimento', {
                error: error.message,
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
    async findAll(page = 1, limit = 10, filters = {}, detailed = false) {
        try {
            // Normaliza parâmetros
            if (typeof page === 'object') {
                [filters, page, limit, detailed] = [page, 1, 10, false];
            }

            page = Number(page) || 1;
            limit = Number(limit) || 10;

            logger.debug('MovementService.findAll - Entrada DETALHADA', { 
                filters: JSON.stringify(filters), 
                page, 
                limit,
                detailed,
                filtersType: typeof filters,
                pageType: typeof page,
                limitType: typeof limit
            });

            // Executa busca no repositório
            const result = await this.movementRepository.findAll(page, limit, filters);
            
            logger.debug('MovementService.findAll - Resultado Repositório DETALHADO', { 
                resultKeys: Object.keys(result),
                itemsCount: result.items ? result.items.length : 0,
                resultJSON: JSON.stringify(result)
            });

            // Se detailed for true, adiciona detalhes de cada movimento
            const processedItems = detailed 
                ? await Promise.all(
                    (result.items || []).map(async (movement) => {
                        try {
                            const detailedMovement = await this.findById(movement.movement_id, true);
                            return detailedMovement;
                        } catch (error) {
                            logger.warn('Erro ao buscar detalhes do movimento', { 
                                movementId: movement.movement_id,
                                error: error.message 
                            });
                            return movement;
                        }
                    })
                )
                : (result.items || []);

            // Prepara resultado final
            const processedResult = {
                items: processedItems,
                meta: result.meta || {
                    totalItems: 0,
                    itemCount: 0,
                    itemsPerPage: limit,
                    totalPages: 1,
                    currentPage: page
                },
                links: result.links || {
                    first: `/movements?page=1&limit=${limit}`,
                    previous: null,
                    next: null,
                    last: `/movements?page=1&limit=${limit}`
                }
            };

            logger.debug('MovementService.findAll - Resultado Processado DETALHADO', { 
                processedResultKeys: Object.keys(processedResult),
                processedItemsCount: processedResult.items.length,
                processedResultJSON: JSON.stringify(processedResult)
            });

            return processedResult;
        } catch (error) {
            logger.error('Erro ao buscar movimentos', { 
                error: error.message, 
                stack: error.stack,
                filters: JSON.stringify(filters),
                errorObject: JSON.stringify(error, Object.getOwnPropertyNames(error))
            });
            
            // Retorno de último recurso
            return {
                items: [],
                meta: {
                    totalItems: 0,
                    itemCount: 0,
                    itemsPerPage: limit,
                    totalPages: 1,
                    currentPage: page
                },
                links: {
                    first: `/movements?page=1&limit=${limit}`,
                    previous: null,
                    next: null,
                    last: `/movements?page=1&limit=${limit}`
                }
            };
        }
    }

    /**
     * Cria um novo movimento
     */
    async create(data) {
        return this.movementPaymentRepository.transaction(async (client) => {
            logger.info('Service: Criando novo movimento', { data });

            // Separar dados do movimento e do pagamento
            const { payment_method_id, items, ...movementData } = data;

            // Definir data do movimento se não fornecida
            movementData.movement_date = movementData.movement_date || new Date().toISOString().split('T')[0];
            
            // Definir status padrão se não fornecido
            movementData.movement_status_id = movementData.movement_status_id || 2; // Assumindo que 2 é o status padrão

            // Criar movimento usando o cliente de transação
            const movement = await this.movementRepository.create(movementData);
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

            // Se tiver payment_method_id, criar o movimento_payment usando a rota existente
            if (payment_method_id) {
                logger.info('Service: Criando movimento_payment via createPayment', {
                    movement_id: movement.movement_id,
                    payment_method_id,
                    total_amount: data.total_amount
                });

                await this.createPayment(movement.movement_id, {
                    payment_method_id,
                    total_amount: data.total_amount
                });
            }

            // Após criar o movimento, envia mensagem de faturamento
            const person = await this.personRepository.findById(data.person_id);
            await this._processBillingMessage(movement, person);

            // Invalidar cache
            await this.invalidateCache();

            return new MovementResponseDTO(movement);
        });
    }

    /**
     * Processa mensagem de faturamento
     * @private
     */
    async _processBillingMessage(movement, person) {
        try {
            logger.info('Iniciando processamento de mensagem de faturamento', {
                movementId: movement.movement_id,
                personId: person.person_id
            });

            // Usa o serviço de pessoa para buscar contatos
            const PersonService = require('../persons/person.service');
            const personService = new PersonService();
            
            logger.info('Buscando detalhes da pessoa', {
                personId: person.person_id
            });

            const personDetails = await personService.findById(person.person_id, true);
            
            logger.info('Detalhes encontrados', {
                movementId: movement.movement_id,
                personId: person.person_id,
            });

            // Verifica se contacts existe e é um array antes de processar
            const contacts = personDetails.contacts || [];
            
            // Log adicional para detalhes de contatos
            logger.info('Detalhes de contatos', {
                totalContacts: contacts.length,
                contactTypes: contacts.map(c => c.type)
            });

            // Processa mensagem
            await this.billingMessageService.processBillingMessage(movement, person, contacts);
            
            logger.info('Mensagem de faturamento enviada com sucesso', {
                movementId: movement.movement_id,
                personId: person.person_id
            });
        } catch (error) {
            logger.error('Erro ao processar mensagem de faturamento', {
                error: error,
                errorMessage: error.message,
                errorStack: error.stack,
                movementId: movement.movement_id,
                personId: person.person_id
            });
            throw error;
        }
    }

    /**
     * Atualiza um movimento
     */
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

            // Invalidar cache
            await this.invalidateCache();

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

    /**
     * Remove um movimento
     */
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

            // Invalidar cache
            await this.invalidateCache();
        } catch (error) {
            logger.error('Service: Erro ao remover movimento', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    /**
     * Atualiza o status de um movimento
     */
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

            // Invalidar cache
            await this.invalidateCache();

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

    /**
     * Busca pagamentos de um movimento
     */
    async findPaymentsByMovementId(id) {
        try {
            logger.info('Service: Buscando pagamentos do movimento', { id });

            // Busca os pagamentos
            const payments = await this.movementPaymentRepository.findByMovementId(id);
            return payments || [];
            
        } catch (error) {
            logger.error('Service: Erro ao buscar pagamentos do movimento', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    /**
     * Busca parcelas de um pagamento específico
     */
    async findInstallmentsByPaymentId(movementId, paymentId) {
        try {
            logger.info('Service: Buscando parcelas do pagamento', { 
                movementId,
                paymentId 
            });

            // Primeiro verifica se o pagamento pertence ao movimento
            const payment = await this.movementPaymentRepository.findByMovementId(movementId);
            if (!payment || !payment.find(p => p.payment_id === paymentId)) {
                throw new ValidationError('Pagamento não encontrado para este movimento');
            }

            // Busca as parcelas
            const installments = await this.installmentRepository.findByPaymentId(paymentId);
            return installments || [];
            
        } catch (error) {
            logger.error('Service: Erro ao buscar parcelas do pagamento', {
                error: error.message,
                movementId,
                paymentId
            });
            throw error;
        }
    }

    /**
     * Cria um novo pagamento para o movimento
     */
    async createPayment(movementId, paymentData) {
        return this.movementPaymentRepository.transaction(async (client) => {
            logger.info('Service: Criando pagamento para movimento', { 
                movementId, 
                paymentData 
            });

            // Validar dados do pagamento
            const validatedPaymentData = await this.validatePaymentData(paymentData);

            // Usar o serviço de pagamento de movimento
            const MovementPaymentService = require('../movement-payments/movement-payment.service');
            const movementPaymentService = new MovementPaymentService({
                movementPaymentRepository: this.movementPaymentRepository,
                cacheService: this.cacheService,
                installmentRepository: this.installmentRepository,
                boletoService: this.boletoService
            });

            // Usar o serviço de métodos de pagamento
            const PaymentMethodService = require('../payment-methods/payment-method.service');
            const paymentMethodService = new PaymentMethodService({
                paymentMethodRepository: this.paymentMethodRepository,
                cacheService: this.cacheService
            });

            // Criar pagamento
            const payment = await movementPaymentService.create({
                ...validatedPaymentData, 
                movement_id: movementId 
            });

            // Se houver parcelas, criar parcelas
            if (paymentData.installments && paymentData.installments.length > 0) {
                await this.createInstallments(client, payment.movement_payment_id, paymentData.installments);
            }

            // Atualizar status do movimento se necessário
            await this.updateMovementStatus(client, movementId, payment);

            logger.info('Service: Pagamento criado com sucesso', { 
                movementId, 
                paymentId: payment.movement_payment_id 
            });

            return payment;
        });
    }

    /**
     * Remove um pagamento do movimento
     */
    async deletePayment(movementId, paymentId) {
        try {
            logger.info('Service: Removendo pagamento do movimento', { 
                movementId,
                paymentId 
            });

            // Verifica se o pagamento pertence ao movimento
            const payment = await this.movementPaymentRepository.findByMovementId(movementId);
            if (!payment || !payment.find(p => p.payment_id === paymentId)) {
                throw new ValidationError('Pagamento não encontrado para este movimento');
            }

            // Remove o pagamento
            await this.movementPaymentRepository.delete(paymentId);
            
        } catch (error) {
            logger.error('Service: Erro ao remover pagamento', {
                error: error.message,
                movementId,
                paymentId
            });
            throw error;
        }
    }

    /**
     * Atualiza o status do movimento
     */
    async updateMovementStatus(client, movementId, payment) {
        try {
            logger.info('Service: Atualizando status do movimento', { 
                movementId, 
                paymentStatus: payment?.status 
            });

            // Lógica para atualizar o status do movimento baseado no pagamento
            // Por exemplo, se o pagamento for concluído, atualizar o status do movimento
            const newStatus = payment?.status === 'Concluído' ? 3 : 2; // Assumindo que 2 é pendente e 3 é concluído

            const updatedMovement = await this.movementRepository.update(movementId, {
                movement_status_id: newStatus
            });

            logger.info('Service: Status do movimento atualizado', { 
                movementId, 
                newStatus 
            });

            return updatedMovement;
        } catch (error) {
            logger.error('Service: Erro ao atualizar status do movimento', {
                error: error.message,
                movementId,
                errorStack: error.stack
            });
            throw error;
        }
    }

    /**
     * Invalida o cache de movimentos
     */
    async invalidateCache() {
        if (!this.cacheService) return;

        try {
            const pattern = `${this.cachePrefix}:*`;
            await this.cacheService.deletePattern(pattern);
        } catch (error) {
            logger.error('Service: Erro ao invalidar cache', {
                error: error.message
            });
        }
    }

    /**
     * Valida os dados do movimento
     */
    validateMovementData(data, isUpdate = false) {
        // Validações básicas se não for update
        if (!isUpdate) {
            if (!data.description) {
                throw new ValidationError('Descrição é obrigatória');
            }
            if (!data.total_amount || data.total_amount <= 0) {
                throw new ValidationError('Valor deve ser maior que zero');
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
        if (data.total_amount !== undefined && data.total_amount <= 0) {
            throw new ValidationError('Valor deve ser maior que zero');
        }
        if (data.description !== undefined && data.description.length < 3) {
            throw new ValidationError('Descrição deve ter no mínimo 3 caracteres');
        }
    }

    /**
     * Valida a transição de status
     */
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

    /**
     * Valida os filtros
     */
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

    /**
     * Prepara os filtros para a query
     */
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

    /**
     * Valida os dados de pagamento
     */
    async validatePaymentData(paymentData) {
        logger.info('Service: Validando dados de pagamento', { paymentData });

        // Validar payment_method_id
        if (!paymentData.payment_method_id) {
            throw new ValidationError('ID do método de pagamento é obrigatório');
        }

        // Verificar se o método de pagamento existe
        const paymentMethodExists = await this.paymentMethodRepository.findById(paymentData.payment_method_id);
        if (!paymentMethodExists) {
            throw new ValidationError('Método de pagamento não encontrado');
        }

        // Validar total_amount
        if (!paymentData.total_amount || paymentData.total_amount <= 0) {
            throw new ValidationError('Valor total do pagamento deve ser maior que zero');
        }

        // Preparar dados validados
        const validatedData = {
            payment_method_id: paymentData.payment_method_id,
            total_amount: paymentData.total_amount
        };

        // Adicionar campos opcionais se existirem
        if (paymentData.payment_date) {
            validatedData.payment_date = paymentData.payment_date;
        }

        if (paymentData.observation) {
            validatedData.observation = paymentData.observation;
        }

        return validatedData;
    }

    /**
     * Cria boletos para um movimento
     * @param {number} movementId - ID do movimento
     * @returns {Promise<Array>} Boletos criados
     */
    async createBoletosMovimento(movementId) {
        try {
            logger.info('Service: Criando boletos para movimento', { movementId });

            // Buscar parcelas do movimento
            const parcelas = await this.installmentRepository.findByMovementId(movementId);
            
            logger.info('Service: Parcelas encontradas', { 
                movementId, 
                quantidadeParcelas: parcelas.length,
                parcelas: parcelas.map(p => p.installment_id)
            });

            if (!parcelas || parcelas.length === 0) {
                logger.warn('Service: Nenhuma parcela encontrada para o movimento', { movementId });
                return [];
            }

            // Filtrar parcelas sem boleto
            const parcelasSemBoleto = [];
            for (const parcela of parcelas) {
                const query = 'SELECT COUNT(*) as count FROM boletos WHERE installment_id = $1';
                const result = await this.boletoRepository.pool.query(query, [parcela.installment_id]);
                
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

                const boleto = await this.boletoRepository.createBoleto(boletoData);
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

    /**
     * Cancela um movimento
     * @param {number} movementId - ID do movimento a ser cancelado
     * @returns {Promise<Object>} Resultado do cancelamento
     */
    async cancelMovement(movementId) {
        // Verifica se o movimento existe
        const movement = await this.findById(movementId);
        if (!movement) {
            throw new ValidationError('Movimento não encontrado');
        }

        // Valida se o movimento já não está cancelado
        if (movement.movement_status_id === 99) {
            throw new ValidationError('Movimento já está cancelado');
        }

        // Atualiza status do movimento para 99 (cancelado)
        await this.movementRepository.update(movementId, { 
            movement_status_id: 99 
        });

        // Busca installments do movimento
        const installments = await this.installmentRepository.findByMovementId(movementId);
        
        // Log para rastrear parcelas
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
            movement_id: movementId,
            cancelResults 
        };
    }

    /**
     * Cria uma NFSE para um movimento específico
     * @param {number} movementId - ID do movimento
     * @param {object} [options] - Opções adicionais
     * @param {string} [options.ambiente='HOMOLOGACAO'] - Ambiente de emissão da NFSE
     * @returns {Promise<Object>} NFSE criada
     */
    async createMovementNFSe(movementId, options = {}) {
        const { ambiente = 'HOMOLOGACAO' } = options;

        // 1. Buscar movimento completo
        const movement = await this.movementRepository.findById(movementId, true);
        if (!movement) {
            throw new Error(`Movimento com ID ${movementId} não encontrado`);
        }

        // 2. Buscar licença do prestador (usando license_id do movimento)
        const license = await this.licenseRepository.findById(movement.license_id);
        if (!license) {
            throw new Error(`Licença não encontrada para o movimento ${movementId}`);
        }

        // 3. Buscar pessoa do movimento (tomador)
        const person = await this.personRepository.findById(movement.person_id);
        if (!person) {
            throw new Error(`Pessoa não encontrada para o movimento ${movementId}`);
        }

        // 4. Buscar itens do movimento
        const movementItems = await this.movementItemRepository.findByMovementId(movementId);
        if (!movementItems || movementItems.length === 0) {
            throw new Error(`Nenhum item encontrado para o movimento ${movementId}`);
        }

        // 5. Buscar detalhes dos serviços
        const itemIds = movementItems.map(item => item.item_id);
        const serviceDetails = await this.serviceRepository.findMultipleServiceDetails(itemIds);
        const serviceDetailsMap = serviceDetails.reduce((acc, service) => {
            acc[service.item_id] = service;
            return acc;
        }, {});

        // 6. Preparar payload para NFSE
        const nfsePayload = {
            reference_id: movementId.toString(),
            prestador_cnpj: license.cnpj,
            prestador_razao_social: license.company_name,
            
            tomador_cnpj: person.document_number, // Pode ser CNPJ ou CPF
            tomador_razao_social: person.name,
            
            valor_total: movement.total_amount,
            valor_servicos: movement.total_amount,
            ambiente: ambiente,
            
            items: movementItems.map(item => {
                const serviceInfo = serviceDetailsMap[item.item_id] || {};
                return {
                    descricao: item.description || serviceInfo.item_description,
                    quantidade: item.quantity || 1,
                    valor_unitario: item.unit_value,
                    valor_total: item.quantity * item.unit_value,
                    
                    // Detalhes fiscais
                    cnae: serviceInfo.cnae,
                    cod_tributacao: serviceInfo.lc116_code,
                    cod_municipio: serviceInfo.municipality_code,
                    descricao_servico: serviceInfo.lc116_description
                };
            })
        };

        // 7. Chamar serviço de NFSE para criar
        const nfse = await this.nfseService.create(nfsePayload);

        return nfse;
    }
}

module.exports = MovementService;
