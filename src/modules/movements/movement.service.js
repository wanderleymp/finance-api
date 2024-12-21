const MovementRepository = require('./movement.repository');
const PersonRepository = require('../persons/person.repository');
const MovementTypeRepository = require('../movement-types/movement-type.repository');
const MovementStatusRepository = require('../movement-statuses/movement-status.repository');
const MovementPaymentRepository = require('../movement-payments/movement-payment.repository');
const InstallmentRepository = require('../installments/installment.repository');
const { logger } = require('../../middlewares/logger');
const { ValidationError } = require('../../utils/errors');
const IMovementService = require('./interfaces/IMovementService');
const { MovementResponseDTO } = require('./dto/movement.dto');

class MovementService extends IMovementService {
    constructor({ movementRepository, cacheService }) {
        super();
        this.movementRepository = movementRepository || new MovementRepository();
        this.personRepository = new PersonRepository();
        this.movementTypeRepository = new MovementTypeRepository();
        this.movementStatusRepository = new MovementStatusRepository();
        this.movementPaymentRepository = new MovementPaymentRepository();
        this.installmentRepository = new InstallmentRepository();
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

            const data = detailed 
                ? await this.findById(id, true)
                : await this.movementRepository.findById(id);

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
     * Busca movimento por ID
     */
    async findById(id, detailed = false) {
        try {
            // Tenta buscar do cache
            const cacheKey = `movement:${id}:${detailed}`;
            const cachedData = await this.cacheService?.get(cacheKey);
            if (cachedData) {
                return cachedData;
            }

            // Busca o movimento básico
            const movement = await this.movementRepository.findById(id);
            if (!movement) {
                throw new ValidationError('Movimento não encontrado');
            }

            // Busca dados básicos relacionados (sempre)
            const [person, type, status] = await Promise.all([
                this.personRepository.findById(movement.person_id),
                this.movementTypeRepository.findById(movement.movement_type_id),
                this.movementStatusRepository.findById(movement.movement_status_id)
            ]);

            // Enriquece com dados básicos
            const enrichedMovement = {
                ...movement,
                person_name: person?.full_name,
                type_name: type?.type_name,
                status_name: status?.status_name
            };

            // Se não precisa de detalhes, retorna com os dados básicos
            if (!detailed) {
                return enrichedMovement;
            }

            // Busca dados detalhados
            const [
                personContacts,
                payments,
                installments
            ] = await Promise.all([
                person ? this.personRepository.findContacts(person.person_id) : null,
                this.movementPaymentRepository.findByMovementId(movement.movement_id),
                this.installmentRepository.findByMovementId(movement.movement_id)
            ]);

            // Calcula totais
            const total_paid = payments
                .filter(p => p.status_id === 2) // Status "Confirmado"
                .reduce((sum, p) => sum + p.amount, 0);

            // Enriquece com dados detalhados
            const detailedMovement = {
                ...enrichedMovement,
                // Dados detalhados da pessoa
                person_email: personContacts?.find(c => c.contact_type === 'EMAIL' && c.is_main)?.contact_value,
                person_phone: personContacts?.find(c => c.contact_type === 'PHONE' && c.is_main)?.contact_value,
                // Dados detalhados do tipo e status
                type_description: type?.description,
                status_description: status?.description,
                // Listas relacionadas
                payments,
                installments,
                // Campos calculados
                total_paid,
                remaining_amount: movement.total_amount - total_paid
            };

            // Salva no cache
            await this.cacheService?.set(cacheKey, detailedMovement, this.cacheTTL.detail);

            return detailedMovement;
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
            const detailed = filters.detailed === 'true' || filters.detailed === true;

            // Tenta buscar do cache
            const cacheKey = `movements:${page}:${limit}:${JSON.stringify(preparedFilters)}:${detailed}`;
            const cachedData = await this.cacheService?.get(cacheKey);
            if (cachedData) {
                return cachedData;
            }

            // Busca os movimentos com paginação
            const { data: movements, total } = await this.movementRepository.findAll(page, limit, preparedFilters);

            // Para cada movimento, busca os dados relacionados
            const enrichedData = await Promise.all(movements.map(async movement => {
                return this.findById(movement.movement_id, detailed);
            }));

            const result = {
                data: enrichedData,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(total),
                    total_pages: Math.ceil(total / limit)
                }
            };

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

            // Validações específicas
            this.validateMovementData(data);

            // Criar movimento
            const movement = await this.movementRepository.create(data);

            // Invalidar cache
            await this.invalidateCache();

            return new MovementResponseDTO(movement);
        } catch (error) {
            logger.error('Service: Erro ao criar movimento', {
                error: error.message,
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
            if (!data.type || !['INCOME', 'EXPENSE'].includes(data.type)) {
                throw new ValidationError('Tipo inválido');
            }
            if (!data.value || data.value <= 0) {
                throw new ValidationError('Valor deve ser maior que zero');
            }
            if (!data.due_date) {
                throw new ValidationError('Data de vencimento é obrigatória');
            }
            if (!data.person_id) {
                throw new ValidationError('Pessoa é obrigatória');
            }
        }

        // Validações para campos específicos em update
        if (data.value !== undefined && data.value <= 0) {
            throw new ValidationError('Valor deve ser maior que zero');
        }
        if (data.type !== undefined && !['INCOME', 'EXPENSE'].includes(data.type)) {
            throw new ValidationError('Tipo inválido');
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
