const itemRepository = require('../repositories/itemRepository');
const PaginationHelper = require('../utils/paginationHelper');
const { ValidationError } = require('../utils/errors');
const { logger } = require('../middlewares/logger');

class ItemService {
    async listItems(page = 1, limit = 10, filters = {}) {
        try {
            const { page: validPage, limit: validLimit } = PaginationHelper.validateParams(page, limit);
            
            // Preparar filtros dinâmicos
            const dynamicFilters = {};
            
            if (filters.name) {
                dynamicFilters.name = filters.name;
            }
            
            if (filters.category) {
                dynamicFilters.category = filters.category;
            }
            
            if (filters.min_price || filters.max_price) {
                dynamicFilters.price = {};
                
                if (filters.min_price) {
                    dynamicFilters.price.$gte = parseFloat(filters.min_price);
                }
                
                if (filters.max_price) {
                    dynamicFilters.price.$lte = parseFloat(filters.max_price);
                }
            }
            
            const items = await itemRepository.findAll(validPage, validLimit, dynamicFilters);
            
            logger.info('Serviço: Listagem de itens', {
                totalItems: items.total,
                page: validPage,
                limit: validLimit,
                filters: dynamicFilters
            });

            return PaginationHelper.formatResponse(
                items.data, 
                items.total, 
                validPage, 
                validLimit
            );
        } catch (error) {
            logger.error('Erro no serviço ao listar itens', {
                errorMessage: error.message,
                page,
                limit,
                filters
            });
            throw error;
        }
    }

    async getItemById(itemId) {
        try {
            const item = await itemRepository.findById(itemId);
            
            if (!item) {
                throw new ValidationError('Item não encontrado');
            }
            
            logger.info('Serviço: Detalhes do item', {
                itemId
            });

            return item;
        } catch (error) {
            logger.error('Erro no serviço ao buscar item', {
                errorMessage: error.message,
                itemId
            });
            throw error;
        }
    }

    async createItem(itemData) {
        try {
            // Validações adicionais de negócio podem ser feitas aqui
            if (!itemData.name) {
                throw new ValidationError('Nome do item é obrigatório');
            }

            if (itemData.price && itemData.price < 0) {
                throw new ValidationError('Preço não pode ser negativo');
            }

            const newItem = await itemRepository.create(itemData);
            
            logger.info('Serviço: Item criado', {
                itemId: newItem.id,
                name: newItem.name
            });

            return newItem;
        } catch (error) {
            logger.error('Erro no serviço ao criar item', {
                errorMessage: error.message,
                itemData
            });
            throw error;
        }
    }

    async updateItem(itemId, updateData) {
        try {
            // Validações de negócio
            if (updateData.price && updateData.price < 0) {
                throw new ValidationError('Preço não pode ser negativo');
            }

            // Verificar se o item existe antes de atualizar
            const existingItem = await this.getItemById(itemId);

            const updatedItem = await itemRepository.update(itemId, updateData);
            
            logger.info('Serviço: Item atualizado', {
                itemId,
                updatedFields: Object.keys(updateData)
            });

            return updatedItem;
        } catch (error) {
            logger.error('Erro no serviço ao atualizar item', {
                errorMessage: error.message,
                itemId,
                updateData
            });
            throw error;
        }
    }

    async deleteItem(itemId) {
        try {
            // Verificar se o item existe antes de deletar
            await this.getItemById(itemId);

            await itemRepository.delete(itemId);
            
            logger.info('Serviço: Item excluído', {
                itemId
            });

            return true;
        } catch (error) {
            logger.error('Erro no serviço ao excluir item', {
                errorMessage: error.message,
                itemId
            });
            throw error;
        }
    }
}

module.exports = new ItemService();
