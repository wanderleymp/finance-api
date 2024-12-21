const { logger } = require('../../middlewares/logger');
const { ValidationError } = require('../../utils/errors');
const IMovementService = require('./interfaces/IMovementService');
const { MovementResponseDTO } = require('./dto/movement.dto');
const MovementRepository = require('./movement.repository');

class MovementService extends IMovementService {
    constructor({ movementRepository, cacheService }) {
        super();
        this.movementRepository = movementRepository;
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
    async getMovementById(id) {
        try {
            logger.info('Serviço: Buscando movimento por ID', { id });
            
            let movement;
            
            if (this.cacheService) {
                const cacheKey = this.cacheService.generateKey(`${this.cachePrefix}:detail`, { id });
                movement = await this.cacheService.get(cacheKey);
                
                if (movement) {
                    logger.info('Service: Retornando movimento do cache', { id });
                    return movement;
                }
            }

            const data = await this.movementRepository.findById(id);
            if (!data) {
                throw new ValidationError('Movimento não encontrado');
            }

            movement = new MovementResponseDTO(data);

            if (this.cacheService) {
                const cacheKey = this.cacheService.generateKey(`${this.cachePrefix}:detail`, { id });
                await this.cacheService.set(cacheKey, movement, this.cacheTTL.detail);
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
     * Lista movimentos com paginação e filtros
     */
    async findAll(page = 1, limit = 10, filters = {}, detailed = true) {
        try {
            logger.info('Service: Iniciando listagem de movimentos', {
                page,
                limit,
                filters,
                detailed
            });

            // Prepara os filtros
            const preparedFilters = { ...filters };

            // Converte as datas para o formato correto
            if (preparedFilters.movement_date_start) {
                const startDate = new Date(preparedFilters.movement_date_start);
                if (isNaN(startDate.getTime())) {
                    throw new ValidationError('Data inicial inválida');
                }
                preparedFilters.movement_date_start = startDate.toISOString().split('T')[0];
                logger.debug('Data inicial convertida', { 
                    original: filters.movement_date_start,
                    converted: preparedFilters.movement_date_start 
                });
            }
            if (preparedFilters.movement_date_end) {
                const endDate = new Date(preparedFilters.movement_date_end);
                if (isNaN(endDate.getTime())) {
                    throw new ValidationError('Data final inválida');
                }
                preparedFilters.movement_date_end = endDate.toISOString().split('T')[0];
                logger.debug('Data final convertida', { 
                    original: filters.movement_date_end,
                    converted: preparedFilters.movement_date_end 
                });
            }

            let cached;
            
            if (this.cacheService) {
                const cacheKey = this.cacheService.generateKey(`${this.cachePrefix}:list`, { 
                    page, 
                    limit, 
                    filters: preparedFilters, 
                    detailed 
                });
                cached = await this.cacheService.get(cacheKey);
            }
            
            if (cached) {
                logger.info('Service: Retornando movimentos do cache', { 
                    page, 
                    limit,
                    filters: preparedFilters,
                    detailed 
                });
                return cached;
            }

            const movements = detailed 
                ? await this.movementRepository.findAllDetailed(page, limit, preparedFilters)
                : await this.movementRepository.findAll(page, limit, preparedFilters);

            const response = {
                ...movements,
                data: movements.data.map(movement => new MovementResponseDTO(movement))
            };

            if (this.cacheService) {
                const cacheKey = this.cacheService.generateKey(`${this.cachePrefix}:list`, { 
                    page, 
                    limit, 
                    filters: preparedFilters, 
                    detailed 
                });
                await this.cacheService.set(cacheKey, response, this.cacheTTL.list);
            }

            return response;
        } catch (error) {
            logger.error('Service: Erro ao listar movimentos', {
                error: error.message,
                page,
                limit,
                filters,
                detailed
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
}

module.exports = MovementService;
