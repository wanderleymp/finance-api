const movementStatusService = require('../services/movementStatusService');
const { handleResponse, handleError } = require('../utils/responseHandler');
const { logger } = require('../middlewares/logger');

class MovementStatusController {
    async index(req, res) {
        try {
            logger.info('Iniciando listagem de status de movimentação', {
                query: req.query
            });
            
            const { page, limit, ...filters } = req.query;
            const result = await movementStatusService.listMovementStatuses(page, limit, filters);
            
            logger.info('Listagem de status de movimentação concluída', { 
                count: result.data.length,
                currentPage: result.meta.current_page,
                totalRecords: result.meta.total
            });
            
            handleResponse(res, 200, result);
        } catch (error) {
            logger.error('Erro na listagem de status de movimentação', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            handleError(res, error);
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;
            
            logger.info('Buscando status de movimentação por ID', { id });
            
            const movementStatus = await movementStatusService.getMovementStatusById(id);
            
            handleResponse(res, 200, movementStatus);
        } catch (error) {
            logger.error('Erro ao buscar status de movimentação', {
                errorMessage: error.message,
                errorStack: error.stack,
                id: req.params.id
            });
            handleError(res, error);
        }
    }

    async store(req, res) {
        try {
            const movementStatusData = req.body;
            
            logger.info('Criando novo status de movimentação', { movementStatusData });
            
            const newMovementStatus = await movementStatusService.createMovementStatus(movementStatusData);
            
            handleResponse(res, 201, newMovementStatus, 'Status de movimentação criado com sucesso');
        } catch (error) {
            logger.error('Erro ao criar status de movimentação', {
                errorMessage: error.message,
                errorStack: error.stack,
                movementStatusData: req.body
            });
            handleError(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const movementStatusData = req.body;
            
            logger.info('Atualizando status de movimentação', { 
                id, 
                movementStatusData 
            });
            
            const updatedMovementStatus = await movementStatusService.updateMovementStatus(id, movementStatusData);
            
            handleResponse(res, 200, updatedMovementStatus, 'Status de movimentação atualizado com sucesso');
        } catch (error) {
            logger.error('Erro ao atualizar status de movimentação', {
                errorMessage: error.message,
                errorStack: error.stack,
                id: req.params.id,
                movementStatusData: req.body
            });
            handleError(res, error);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            
            logger.info('Excluindo status de movimentação', { id });
            
            const deletedMovementStatus = await movementStatusService.deleteMovementStatus(id);
            
            handleResponse(res, 200, deletedMovementStatus, 'Status de movimentação excluído com sucesso');
        } catch (error) {
            logger.error('Erro ao excluir status de movimentação', {
                errorMessage: error.message,
                errorStack: error.stack,
                id: req.params.id
            });
            handleError(res, error);
        }
    }
}

module.exports = new MovementStatusController();
