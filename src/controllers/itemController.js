const itemService = require('../services/itemService');
const { handleResponse, handleError } = require('../utils/responseHandler');
const { logger } = require('../middlewares/logger');

class ItemController {
    async index(req, res) {
        try {
            logger.info('Iniciando listagem de items', {
                query: req.query
            });
            
            const { page, limit, ...filters } = req.query;
            const result = await itemService.listItems(page, limit, filters);
            
            logger.info('Listagem de items concluída', { 
                count: result.data.length,
                currentPage: result.meta.current_page,
                totalRecords: result.meta.total,
                filters: filters
            });
            
            handleResponse(res, 200, result);
        } catch (error) {
            logger.error('Erro na listagem de items', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            handleError(res, error);
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;
            
            logger.info('Buscando item por ID', { id });
            
            const item = await itemService.getItemById(id);
            
            handleResponse(res, 200, item);
        } catch (error) {
            logger.error('Erro ao buscar item', {
                errorMessage: error.message,
                errorStack: error.stack,
                id: req.params.id
            });
            handleError(res, error);
        }
    }

    async store(req, res) {
        try {
            logger.info('Criando novo item', { 
                data: req.body 
            });

            const newItem = await itemService.createItem(req.body);
            
            logger.info('Item criado com sucesso', { 
                itemId: newItem.id 
            });

            handleResponse(res, 201, newItem);
        } catch (error) {
            logger.error('Erro ao criar item', {
                errorMessage: error.message,
                errorStack: error.stack,
                data: req.body
            });
            handleError(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            logger.info('Atualizando item', { 
                itemId: id,
                updateData 
            });

            const updatedItem = await itemService.updateItem(id, updateData);
            
            logger.info('Item atualizado com sucesso', { 
                itemId: id 
            });

            handleResponse(res, 200, updatedItem);
        } catch (error) {
            logger.error('Erro ao atualizar item', {
                errorMessage: error.message,
                errorStack: error.stack,
                itemId: req.params.id,
                updateData: req.body
            });
            handleError(res, error);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;

            logger.info('Excluindo item', { itemId: id });

            await itemService.deleteItem(id);
            
            logger.info('Item excluído com sucesso', { itemId: id });

            handleResponse(res, 204);
        } catch (error) {
            logger.error('Erro ao excluir item', {
                errorMessage: error.message,
                errorStack: error.stack,
                itemId: req.params.id
            });
            handleError(res, error);
        }
    }
}

module.exports = new ItemController();
