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
        boletoRepository 
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
    async getMovementById(id, detailed = false) {
        try {
            logger.info('Serviço: Buscando movimento por ID', { id, detailed });
            
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

            const data = await this.findById(id, detailed);

            if (!data) {
                throw new ValidationError('Movimento não encontrado');
            }

            movement = new MovementResponseDTO(data);

            if (this.cacheService) {
                await this.cacheService.set(
                    cacheKey, 
                    movement, 
                    detailed ? this.cacheTTL.detail : this.cacheTTL.list
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
    async findById(id, detailed = false) {
        try {
            logger.info('Service: Buscando movimento por ID', { id, detailed });

            // Busca movimento base
            const movement = await this.movementRepository.findById(id);

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

            // Se não for detailed, retorna movimento básico
            if (!detailed) {
                return movement;
            }

            // Se detailed, carrega installments e boletos
            const [person, type, status, payments] = await Promise.all([
                this.personRepository.findById(movement.person_id),
                this.movementTypeRepository.findById(movement.movement_type_id),
                this.movementStatusRepository.findById(movement.movement_status_id),
                this.movementPaymentService.findByMovementId(movement.movement_id, true) // Passa detailed true
            ]);

            // Log dos resultados das promises
            logger.info('Service: Resultados das promises', {
                person_found: !!person,
                type_found: !!type,
                status_found: !!status,
                payments_count: payments.length
            });

            // Calcula totais
            const total_paid = payments
                .filter(p => p.status_id === 2) // Status "Confirmado"
                .reduce((sum, p) => sum + p.amount, 0);

            const total_value = payments.reduce((sum, p) => sum + p.amount, 0);

            const enrichedPerson = person ? {
                ...person,
                contacts: await this.personRepository.findContacts(person.person_id)
            } : null;

            // Log do movimento enriquecido
            logger.info('Service: Movimento enriquecido', {
                movement_id: movement.movement_id,
                total_paid,
                total_value,
                remaining_amount: total_value - total_paid
            });

            return {
                ...movement,
                person_name: person?.full_name,
                type_name: type?.type_name,
                status_name: status?.status_name,
                person: enrichedPerson,
                payments,
                total_paid,
                total_value,
                remaining_amount: total_value - total_paid
            };
        } catch (error) {
            logger.error('Erro ao buscar movimento por ID', {
                error: error.message,
                id,
                detailed,
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
     */
    async findAll(page = 1, limit = 10, filters = {}, detailed = false) {
        try {
            logger.info('Serviço: Listando movimentos', { 
                page, 
                limit, 
                filters,
                detailed 
            });

            const result = await this.movementRepository.findAll(page, limit, filters);

            if (detailed) {
                // Se detailed for true, adiciona informações adicionais para cada movimento
                const detailedItems = await Promise.all(
                    result.items.map(async (movement) => {
                        const movementPayments = await this.movementPaymentRepository.findByMovementId(movement.movement_id);
                        return {
                            ...movement,
                            payments: movementPayments
                        };
                    })
                );

                result.items = detailedItems;
            }

            return result;
        } catch (error) {
            logger.error('Serviço: Erro ao listar movimentos', {
                error: error.message,
                error_stack: error.stack,
                page,
                limit,
                filters
            });
            throw error;
        }
    }

    /**
     * Cria um novo movimento
     */
    async create(data) {
        return this.movementRepository.transaction(async (client) => {
            logger.info('Service: Criando novo movimento', { data });

            // Separar dados do movimento e do pagamento
            const { payment_method_id, ...movementData } = data;

            // Criar movimento
            const movement = await this.movementRepository.createWithClient(client, movementData);
            logger.info('Service: Movimento criado', { movement });

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
            
            logger.info('Buscando contatos da pessoa', {
                personId: person.person_id
            });

            const contactsResult = await personService.findContacts(person.person_id);
            const contacts = contactsResult.items || [];
            
            logger.info('Contatos encontrados', {
                movementId: movement.movement_id,
                personId: person.person_id,
                contactCount: contacts.length
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

            // Criar pagamento
            const payment = await this.movementPaymentRepository.createWithClient(
                client, 
                { 
                    ...validatedPaymentData, 
                    movement_id: movementId 
                }
            );

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
}

module.exports = MovementService;
