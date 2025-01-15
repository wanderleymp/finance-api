const { logger } = require('../../middlewares/logger');
const { NotFoundError } = require('../../utils/errors');
const ItemRepository = require('./item.repository');
const ItemValidator = require('./validators/item.validator');
const CreateItemDTO = require('./dto/create-item.dto');
const UpdateItemDTO = require('./dto/update-item.dto');
const ItemResponseDTO = require('./dto/item-response.dto');

class ItemService {
    constructor({ 
        itemRepository = new ItemRepository(), 
        cacheService = null
    } = {}) {
        this.repository = itemRepository;
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            ItemValidator.validateFindAll({ ...filters, page, limit });

            const result = await this.repository.findAll(filters, page, limit);
            
            // Transforma em DTOs
            result.data = ItemResponseDTO.fromEntities(result.data);

            return result;
        } catch (error) {
            logger.error('Erro ao listar items', { error });
            throw error;
        }
    }

    async findById(id) {
        try {
            ItemValidator.validateFindById({ id });

            const item = await this.repository.findById(id);
            if (!item) {
                throw new NotFoundError('Item não encontrado');
            }

            // Transforma em DTO
            const itemDTO = ItemResponseDTO.fromEntity(item);

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

            return true;
        } catch (error) {
            logger.error('Erro ao remover item', { error });
            throw error;
        }
    }
}

module.exports = ItemService;
