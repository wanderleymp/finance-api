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
const { systemDatabase } = require('../../config/database');

class MovementService extends IMovementService {
    constructor({ 
        movementRepository,
        personRepository,
        movementTypeRepository,
        movementStatusRepository,
        paymentMethodRepository,
        installmentRepository,
        movementPaymentService,
        personContactRepository,
        boletoRepository,
        boletoService,
        movementPaymentRepository,
        installmentService,
        licenseRepository,
        movementItemRepository,
        nfseService,
        serviceRepository,
        billingMessageService
    }) {
        super();
        
        this.movementRepository = movementRepository;
        this.personRepository = personRepository;
        this.movementTypeRepository = movementTypeRepository;
        this.movementStatusRepository = movementStatusRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.installmentRepository = installmentRepository;
        this.movementPaymentService = movementPaymentService;
        this.personContactRepository = personContactRepository;
        this.boletoRepository = boletoRepository;
        this.boletoService = boletoService;
        this.movementPaymentRepository = movementPaymentRepository;
        this.installmentService = installmentService;
        // Manter a lógica de fallback para criação do licenseRepository
        this.licenseRepository = licenseRepository || new LicenseRepository();
        this.movementItemRepository = movementItemRepository;
        this.nfseService = nfseService;
        this.serviceRepository = serviceRepository;
        this.billingMessageService = billingMessageService;
        this.pool = systemDatabase.pool;
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
                logger.warn('Movimento não encontrado', { movementId: id });
                return null;
            }

            logger.info('Buscando detalhes da pessoa', {
                personId: movement.person_id,
                repositoryMethod: 'findPersonWithDetails'
            });

            const personRepository = new (require('../persons/person.repository'))();
            const personDetails = await personRepository.findPersonWithDetails(movement.person_id);

            logger.info('Detalhes da Pessoa', {
                personId: movement.person_id,
                personDetails: JSON.stringify(personDetails, null, 2)
            });

            logger.info('Documentos do Tomador', {
                documentosEncontrados: personDetails.documents.map(doc => ({
                    id: doc.id,
                    type: doc.document_type || doc.type,
                    value: doc.document_value || doc.value,
                    rawDocument: JSON.stringify(doc, null, 2)
                })),
                personId: movement.person_id
            });

            // Verificar se o tipo da pessoa é PJ ou PF para escolher o documento correto
            const documentType = personDetails.type === 'PJ' ? 'CNPJ' : 'CPF';
            const tomadorDocument = personDetails.documents.find(doc => doc.type === documentType);

            logger.info('DEBUG Tomador Documento', {
                personType: personDetails.type,
                documentType: documentType,
                tomadorDocumento: tomadorDocument,
                todosDocumentos: personDetails.documents
            });

            if (!tomadorDocument) {
                logger.error('Nenhum documento encontrado para o tipo esperado', {
                    personType: personDetails.type,
                    documentType,
                    availableDocuments: JSON.stringify(personDetails.documents),
                    personDetails: JSON.stringify(personDetails)
                });
                throw new Error(`Documento do tomador não encontrado para o tipo ${documentType}`);
            }

            // Extrair endereço dos detalhes
            const tomadorEndereco = personDetails.addresses && personDetails.addresses.length > 0 
                ? personDetails.addresses.find(addr => addr.is_main) || personDetails.addresses[0]
                : null;

            // Adiciona pessoa ao movimento
            movement.person = {
                person_id: movement.person_id,
                document: tomadorDocument.value,
                document_type: tomadorDocument.type,
                address: tomadorEndereco
            };

            // Busca outros detalhes se necessário
            // Por exemplo, installments, payments, etc.

            logger.info('Movimento encontrado', { 
                movementId: id,
                personId: movement.person_id 
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
            const { items, ...movementData } = data;

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

            // Após criar o movimento, envia mensagem de faturamento
            try {
                const person = await this.personRepository.findById(data.person_id);
                // Comentado temporariamente
                // await this._processBillingMessage(movement, person);

                // Cria pagamento se método de pagamento estiver presente
                if (data.payment_method_id) {
                    await this.createPayment(movement.movement_id, {
                        payment_method_id: data.payment_method_id,
                        total_amount: movement.total_amount,
                        movement_id: movement.movement_id,
                        person_id: data.person_id
                    });
                }
            } catch (error) {
                logger.error('Erro ao processar pagamento ou mensagem de faturamento', {
                    error: error.message,
                    personId: data.person_id
                });
            }

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

            // Usar o serviço de métodos de pagamento
            const PaymentMethodService = require('../payment-methods/payment-method.service');
            const paymentMethodService = new PaymentMethodService({
                paymentMethodRepository: this.paymentMethodRepository,
            });

            // Criar pagamento
            const payment = await this.movementPaymentService.create({
                ...validatedPaymentData, 
                movement_id: movementId 
            });

            logger.info('Service: Pagamento criado com sucesso', { 
                movementId, 
                paymentId: payment.movement_payment_id 
            });

            return payment;
        });
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
     * Cria boletos para um movimento
     * @param {number} movementId - ID do movimento
     * @returns {Promise<Array>} Boletos criados
     */
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

    /**
     * Cria uma NFSE para um movimento específico
     * @param {number} movementId - ID do movimento
     * @param {object} [options] - Opções adicionais
     * @param {string} [options.ambiente='homologacao'] - Ambiente de emissão da NFSE
     * @returns {Promise<Object>} NFSE criada
     */
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
        const paymentMethodExists = await this.pool.query(`
            SELECT * FROM payment_methods WHERE payment_method_id = $1
        `, [paymentData.payment_method_id]);

        if (paymentMethodExists.rows.length === 0) {
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
}

module.exports = MovementService;
