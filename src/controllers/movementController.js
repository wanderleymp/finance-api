const movementService = require('../services/movementService');
const { logger } = require('../middlewares/logger');

class MovementController {
    async index(req, res) {
        try {
            const { page, limit, ...filters } = req.query;

            const result = await movementService.findAll(
                page ? parseInt(page, 10) : 1, 
                limit ? parseInt(limit, 10) : 10, 
                filters
            );

            res.json(result);
        } catch (error) {
            logger.error('Erro ao listar movimentações', { 
                error: error.message,
                query: req.query
            });
            
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                message: error.message || 'Erro interno ao listar movimentações',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;
            const movement = await movementService.findById(parseInt(id, 10));
            res.json(movement);
        } catch (error) {
            logger.error('Erro ao buscar movimentação', { 
                error: error.message,
                movementId: req.params.id
            });
            
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                message: error.message || 'Erro interno ao buscar movimentação',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    async create(req, res) {
        try {
            const movementData = req.body;
            const newMovement = await movementService.create(movementData);
            res.status(201).json(newMovement);
        } catch (error) {
            logger.error('Erro ao criar movimentação', { 
                error: error.message,
                movementData: req.body
            });
            
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                message: error.message || 'Erro interno ao criar movimentação',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const movementData = req.body;
            const updatedMovement = await movementService.update(
                parseInt(id, 10), 
                movementData
            );
            res.json(updatedMovement);
        } catch (error) {
            logger.error('Erro ao atualizar movimentação', { 
                error: error.message,
                movementId: req.params.id,
                movementData: req.body
            });
            
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                message: error.message || 'Erro interno ao atualizar movimentação',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const deletedMovement = await movementService.delete(parseInt(id, 10));
            res.json(deletedMovement);
        } catch (error) {
            logger.error('Erro ao excluir movimentação', { 
                error: error.message,
                movementId: req.params.id
            });
            
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                message: error.message || 'Erro interno ao excluir movimentação',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
}

module.exports = new MovementController();
