const movementService = require('../services/movementService');
const { logger } = require('../middlewares/logger');

class MovementController {
    async index(req, res) {
        try {
            const { page, limit, ...filters } = req.query;

            const result = await movementService.findAll(page, limit, filters);
            
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

    async createMovementWithPayment(req, res) {
        try {
            const movementData = req.body;

            // Validações básicas
            if (!movementData.movement_type_id) {
                return res.status(400).json({
                    message: 'Tipo de movimento é obrigatório'
                });
            }

            if (!movementData.total_amount || movementData.total_amount <= 0) {
                return res.status(400).json({
                    message: 'Valor do movimento deve ser maior que zero'
                });
            }

            // Verificar se método de pagamento foi informado
            if (!movementData.payment_method_id) {
                return res.status(400).json({
                    message: 'Método de pagamento é obrigatório para esta operação'
                });
            }

            // Usar serviço de movimento para criar movimento com pagamento
            const newMovement = await movementService.createMovementWithPayment(movementData);

            logger.info('Movimento com pagamento criado com sucesso', {
                movementId: newMovement.movement_id
            });

            res.status(201).json(newMovement);
        } catch (error) {
            logger.error('Erro ao criar movimento com pagamento', { 
                error: error.message,
                movementData: req.body
            });
            
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                message: error.message || 'Erro interno ao criar movimento com pagamento',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
}

module.exports = new MovementController();
