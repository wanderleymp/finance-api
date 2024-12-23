const MovementRepository = require('./movement.repository');
const PersonRepository = require('../persons/person.repository');
const MovementTypeRepository = require('../movement-types/movement-type.repository');
const MovementStatusRepository = require('../movement-statuses/movement-status.repository');
const MovementPaymentRepository = require('../movement-payments/movement-payment.repository');
const InstallmentRepository = require('../installments/installment.repository');
const { logger } = require('../../middlewares/logger');
const { ValidationError } = require('../../utils/errors');
const IMovementService = require('./interfaces/IMovementService');
const MovementResponseDTO = require('./dto/movement-response.dto');

class MovementService extends IMovementService {
    constructor({ 
        movementRepository, 
        cacheService
    }) {
        super();
        
        // Inicializa o repositório principal
        this.movementRepository = movementRepository;
        
        // Inicializa os outros repositórios
        this.movementPaymentRepository = new MovementPaymentRepository();
        this.movementTypeRepository = new MovementTypeRepository();
        this.movementStatusRepository = new MovementStatusRepository();
        this.installmentRepository = new InstallmentRepository();
        this.personRepository = new PersonRepository();

        // Inicializa o cache
        this.cacheService = cacheService;
        this.cachePrefix = 'movements';
        this.cacheTTL = {
            list: 300, // 5 minutos
            detail: 600 // 10 minutos
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
            // Busca o movimento
            const movement = await this.movementRepository.findById(id);
            if (!movement) {
                return null;
            }

            // Enriquece com os dados básicos
            const [person, type, status] = await Promise.all([
                this.personRepository.findById(movement.person_id),
                this.movementTypeRepository.findById(movement.movement_type_id),
                this.movementStatusRepository.findById(movement.movement_status_id)
            ]);

            const result = {
                ...movement,
                person_name: person?.full_name,
                type_name: type?.type_name,
                status_name: status?.status_name
            };

            // Se não for detalhado, retorna apenas os dados básicos
            if (!detailed) {
                return result;
            }

            // Enriquece com os dados detalhados
            const [payments, installments] = await Promise.all([
                this.movementPaymentRepository.findByMovementId(movement.movement_id),
                this.installmentRepository.findByMovementId(movement.movement_id)
            ]);

            // Calcula totais
            const total_paid = payments
                .filter(p => p.status_id === 2) // Status "Confirmado"
                .reduce((sum, p) => sum + p.amount, 0);

            const enrichedPerson = person ? {
                ...person,
                contacts: await this.personRepository.findContacts(person.person_id)
            } : null;

            return {
                ...result,
                person: enrichedPerson,
                payments,
                installments,
                total_paid,
                remaining_amount: movement.total_amount - total_paid
            };
        } catch (error) {
            logger.error('Erro ao buscar movimento por ID', {
                error: error.message,
                id,
                detailed
            });
            throw error;
        }
    }

    /**
     * Lista movimentos com paginação e filtros
     */
    async findAll(page = 1, limit = 10, filters = {}, detailed = false) {
        try {
            logger.info('Service: Iniciando listagem de movimentos', {
                page,
                limit,
                filters,
                detailed
            });

            // Valida os filtros
            this.validateFilters(filters);

            // Prepara os filtros
            const preparedFilters = this.prepareFilters(filters);

            // Tenta buscar do cache
            const cacheKey = this.cacheService?.generateKey(
                `${this.cachePrefix}:${detailed ? 'detail' : 'basic'}:list`, 
                { page, limit, ...preparedFilters }
            );
            
            if (this.cacheService) {
                const cached = await this.cacheService.get(cacheKey);
                if (cached) {
                    logger.info('Service: Retornando lista do cache');
                    return cached;
                }
            }

            // Busca os movimentos básicos
            const movements = await this.movementRepository.findAll(page, limit, preparedFilters);

            // Se não precisa de detalhes, retorna apenas os movimentos
            if (!detailed) {
                return movements;
            }

            // Para cada movimento, busca os dados relacionados
            const enrichedData = await Promise.all(movements.data.map(async movement => {
                return this.findById(movement.movement_id, true);
            }));

            const result = {
                data: enrichedData,
                pagination: movements.pagination
            };

            // Salva no cache
            await this.cacheService?.set(
                cacheKey, 
                result, 
                detailed ? this.cacheTTL.detail : this.cacheTTL.list
            );

            return result;
        } catch (error) {
            logger.error('Erro ao listar movimentos no serviço', {
                error: error.message,
                page,
                limit,
                filters
            });
            throw error;
        }
    }

    /**
     * Lista todos os movimentos
     */
    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            // Valida os filtros
            this.validateFilters(filters);

            // Prepara os filtros
            const preparedFilters = this.prepareFilters(filters);

            // Tenta buscar do cache
            const cacheKey = `movements:${page}:${limit}:${JSON.stringify(preparedFilters)}`;
            const cachedData = await this.cacheService?.get(cacheKey);
            if (cachedData) {
                return cachedData;
            }

            // Busca os movimentos com paginação
            const result = await this.movementRepository.findAll(page, limit, preparedFilters);

            // Salva no cache
            await this.cacheService?.set(cacheKey, result, this.cacheTTL.list);

            return result;
        } catch (error) {
            logger.error('Erro ao listar movimentos no serviço', {
                error: error.message,
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
        try {
            logger.info('Service: Criando novo movimento', { data });

            // Separar dados do movimento e do pagamento
            const { payment_method_id, ...movementData } = data;

            // Criar movimento
            const movement = await this.movementRepository.create(movementData);
            logger.info('Service: Movimento criado', { movement });

            // Se tiver payment_method_id, criar o movimento_payment
            if (payment_method_id) {
                logger.info('Service: Criando movimento_payment', {
                    movement_id: movement.movement_id,
                    payment_method_id,
                    total_amount: data.total_amount
                });

                await this.movementPaymentRepository.create({
                    movement_id: movement.movement_id,
                    payment_method_id,
                    total_amount: data.total_amount,
                    status: 'PENDING'
                });
            }

            // Invalidar cache
            await this.invalidateCache();

            return new MovementResponseDTO(movement);
        } catch (error) {
            logger.error('Service: Erro ao criar movimento', {
                error: error.message,
                error_stack: error.stack,
                data
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
