const { logger } = require('../../middlewares/logger');
const { ValidationError } = require('../../utils/errors');
const IMovementService = require('./interfaces/IMovementService');
const { MovementResponseDTO } = require('./dto/movement.dto');

class MovementService extends IMovementService {
    /**
     * @param {Object} params
     * @param {import('../../repositories/movementRepository')} params.movementRepository
     * @param {import('../../services/cache.service')} params.cacheService
     */
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
            
            const cacheKey = this.cacheService.generateKey(`${this.cachePrefix}:detail`, { id });

            const movement = await this.cacheService.getOrSet(
                cacheKey,
                async () => {
                    const data = await this.movementRepository.findById(id);
                    if (!data) {
                        throw new ValidationError('Movimento não encontrado');
                    }
                    return new MovementResponseDTO(data);
                },
                this.cacheTTL.detail
            );
            
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
     * @param {number} page - Número da página
     * @param {number} limit - Limite de itens por página
     * @param {Object} filters - Filtros a serem aplicados
     * @param {boolean} [detailed=true] - Se deve trazer dados detalhados com relacionamentos
     */
    async findAll(page = 1, limit = 10, filters = {}, detailed = true) {
        try {
            const cacheKey = this.cacheService.generateKey(`${this.cachePrefix}:list`, { page, limit, filters, detailed });
            const cached = await this.cacheService.get(cacheKey);
            
            if (cached) {
                logger.info('Service: Retornando movimentos do cache', { 
                    page, 
                    limit,
                    filters,
                    detailed 
                });
                return cached;
            }

            const movements = detailed 
                ? await this.movementRepository.findAllDetailed(page, limit, filters)
                : await this.movementRepository.findAll(page, limit, filters);

            const response = {
                ...movements,
                data: movements.data.map(movement => new MovementResponseDTO(movement))
            };

            await this.cacheService.set(cacheKey, response, this.cacheTTL.list);
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
}

module.exports = MovementService;
