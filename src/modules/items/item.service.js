const { logger } = require('../../middlewares/logger');
const { NotFoundError } = require('../../utils/errors');
const ItemRepository = require('./item.repository');
const ItemValidator = require('./validators/item.validator');
const CreateItemDTO = require('./dto/create-item.dto');
const UpdateItemDTO = require('./dto/update-item.dto');
const ItemResponseDTO = require('./dto/item-response.dto');
const CacheService = require('../../services/cacheService');

class ItemService {
    constructor({ 
        itemRepository = new ItemRepository(), 
        cacheService = CacheService 
    } = {}) {
        this.repository = itemRepository;
        this.cacheService = cacheService;
        this.cachePrefix = 'item:';
        this.cacheTTL = 3600; // 1 hora
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            ItemValidator.validateFindAll({ ...filters, page, limit });

            const cacheKey = `${this.cachePrefix}list:${JSON.stringify({ filters, page, limit })}`;
            
            // Tenta buscar do cache
            const cachedResult = await this.cacheService.get(cacheKey);
            if (cachedResult) {
                logger.info('Cache hit para listagem de items');
                return cachedResult;
            }

            const result = await this.repository.findAll(filters, page, limit);
            
            // Transforma em DTOs
            result.data = ItemResponseDTO.fromEntities(result.data);

            // Salva no cache
            await this.cacheService.set(cacheKey, result, this.cacheTTL);

            return result;
        } catch (error) {
            logger.error('Erro ao listar items', { error });
            throw error;
        }
    }

    async findById(id) {
        try {
            ItemValidator.validateFindById({ id });

            const cacheKey = `${this.cachePrefix}${id}`;
            
            // Tenta buscar do cache
            const cachedItem = await this.cacheService.get(cacheKey);
            if (cachedItem) {
                logger.info('Cache hit para item', { id });
                return cachedItem;
            }

            const item = await this.repository.findById(id);
            if (!item) {
                throw new NotFoundError('Item não encontrado');
            }

            // Transforma em DTO
            const itemDTO = ItemResponseDTO.fromEntity(item);

            // Salva no cache
            await this.cacheService.set(cacheKey, itemDTO, this.cacheTTL);

            return itemDTO;
        } catch (error) {
            logger.error('Erro ao buscar item por ID', { error });
            throw error;
        }
    }

    async create(data) {
        try {
            const createDTO = new CreateItemDTO(data);
            const item = await this.repository.create(createDTO);
            const itemDTO = ItemResponseDTO.fromEntity(item);

            // Invalida cache de listagem
            await this.invalidateListCache();

            return itemDTO;
        } catch (error) {
            logger.error('Erro ao criar item', { error });
            throw error;
        }
    }

    async update(id, data) {
        try {
            // Verifica se existe
            const existingItem = await this.repository.findById(id);
            if (!existingItem) {
                throw new NotFoundError('Item não encontrado');
            }

            const updateDTO = new UpdateItemDTO(data);
            const updatedItem = await this.repository.update(id, updateDTO);
            const itemDTO = ItemResponseDTO.fromEntity(updatedItem);

            // Invalida caches
            await this.invalidateCache(id);
            await this.invalidateListCache();

            return itemDTO;
        } catch (error) {
            logger.error('Erro ao atualizar item', { error });
            throw error;
        }
    }

    async delete(id) {
        try {
            // Verifica se existe
            const existingItem = await this.repository.findById(id);
            if (!existingItem) {
                throw new NotFoundError('Item não encontrado');
            }

            await this.repository.delete(id);

            // Invalida caches
            await this.invalidateCache(id);
            await this.invalidateListCache();

            return true;
        } catch (error) {
            logger.error('Erro ao remover item', { error });
            throw error;
        }
    }

    async invalidateCache(id) {
        try {
            await this.cacheService.del(`${this.cachePrefix}${id}`);
        } catch (error) {
            logger.error('Erro ao invalidar cache do item', { error, id });
        }
    }

    async invalidateListCache() {
        try {
            const pattern = `${this.cachePrefix}list:*`;
            const keys = await this.cacheService.keys(pattern);
            if (keys.length > 0) {
                await this.cacheService.del(keys);
            }
        } catch (error) {
            logger.error('Erro ao invalidar cache de listagem', { error });
        }
    }
}

module.exports = ItemService;
