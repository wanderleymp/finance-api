const movementTypeService = require('../services/movementTypeService');
const { handleResponse, handleError } = require('../utils/responseHandler');
const { logger } = require('../middlewares/logger');

class MovementTypeController {
    async index(req, res) {
        try {
            logger.info('Iniciando listagem de tipos de movimentação', {
                query: req.query
            });
            
            const { page, limit, ...filters } = req.query;
            const result = await movementTypeService.listMovementTypes(page, limit, filters);
            
            logger.info('Listagem de tipos de movimentação concluída', { 
                count: result.data.length,
                currentPage: result.meta.current_page,
                totalRecords: result.meta.total
            });
            
            handleResponse(res, 200, result);
        } catch (error) {
            logger.error('Erro na listagem de tipos de movimentação', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            handleError(res, error);
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;
            
            logger.info('Buscando tipo de movimentação por ID', { id });
            
            const movementType = await movementTypeService.getMovementTypeById(id);
            
            handleResponse(res, 200, movementType);
        } catch (error) {
            logger.error('Erro ao buscar tipo de movimentação', {
                errorMessage: error.message,
                errorStack: error.stack,
                id: req.params.id
            });
            handleError(res, error);
        }
    }

    async store(req, res) {
        try {
            const movementTypeData = req.body;
            
            logger.info('Criando novo tipo de movimentação', { movementTypeData });
            
            const newMovementType = await movementTypeService.createMovementType(movementTypeData);
            
            handleResponse(res, 201, newMovementType, 'Tipo de movimentação criado com sucesso');
        } catch (error) {
            logger.error('Erro ao criar tipo de movimentação', {
                errorMessage: error.message,
                errorStack: error.stack,
                movementTypeData: req.body
            });
            handleError(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const movementTypeData = req.body;
            
            logger.info('Atualizando tipo de movimentação', { 
                id, 
                movementTypeData 
            });
            
            const updatedMovementType = await movementTypeService.updateMovementType(id, movementTypeData);
            
            handleResponse(res, 200, updatedMovementType, 'Tipo de movimentação atualizado com sucesso');
        } catch (error) {
            logger.error('Erro ao atualizar tipo de movimentação', {
                errorMessage: error.message,
                errorStack: error.stack,
                id: req.params.id,
                movementTypeData: req.body
            });
            handleError(res, error);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            
            logger.info('Excluindo tipo de movimentação', { id });
            
            const deletedMovementType = await movementTypeService.deleteMovementType(id);
            
            handleResponse(res, 200, deletedMovementType, 'Tipo de movimentação excluído com sucesso');
        } catch (error) {
            logger.error('Erro ao excluir tipo de movimentação', {
                errorMessage: error.message,
                errorStack: error.stack,
                id: req.params.id
            });
            handleError(res, error);
        }
    }
}

module.exports = new MovementTypeController();
