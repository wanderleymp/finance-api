const { Router } = require('express');
const MovementController = require('./movement.controller');
const { validateRequest } = require('../../middlewares/requestValidator');
const { logger } = require('../../middlewares/logger');
const { authMiddleware } = require('../../middlewares/auth');
const { 
    listMovementsSchema,
    createMovementSchema,
    updateMovementSchema,
    updateStatusSchema
} = require('./validators/movement.validator');
const movementItemRoutes = require('./movement-items.routes');

/**
 * Configura rotas de movimentações com suporte a injeção de dependência
 * @param {Object} dependencies Dependências para injeção no controlador
 * @returns {Router} Roteador configurado
 */
class MovementRoutes {
    constructor(dependencies = {}) {
        this.router = Router();
        const movementService = dependencies.movementService || dependencies;
        this.movementController = new MovementController({ movementService });
        this.authMiddleware = dependencies.authMiddleware || authMiddleware;
        this.setupRoutes();
    }

    setupRoutes() {
        // Middleware de autenticação para todas as rotas
        this.router.use(this.authMiddleware);

        // Middleware de log para todas as rotas
        this.router.use((req, res, next) => {
            logger.info('Requisição de movimento recebida', {
                method: req.method,
                path: req.path,
                body: req.body,
                params: req.params,
                query: req.query
            });
            next();
        });

        // Rotas RESTful de movimento
        this.router
            .get('/', 
                validateRequest(listMovementsSchema, 'query'),
                this.movementController.index.bind(this.movementController)
            )
            .get('/:id', 
                this.movementController.show.bind(this.movementController)
            )
            .get('/:id/payments',
                this.movementController.listPayments.bind(this.movementController)
            )
            .get('/:id/payments/:paymentId/installments',
                this.movementController.listPaymentInstallments.bind(this.movementController)
            )
            .post('/:id/payments',
                this.movementController.createPayment.bind(this.movementController)
            )
            .delete('/:id/payments/:paymentId',
                this.movementController.deletePayment.bind(this.movementController)
            )
            .post('/', 
                validateRequest(createMovementSchema),
                this.movementController.create.bind(this.movementController)
            )
            .put('/:id', 
                validateRequest(updateMovementSchema),
                this.movementController.update.bind(this.movementController)
            )
            .delete('/:id', 
                this.movementController.delete.bind(this.movementController)
            )
            .patch('/:id/status', 
                validateRequest(updateStatusSchema),
                this.movementController.updateStatus.bind(this.movementController)
            )
            .post('/:id/billing',
                this.movementController.sendBillingMessage.bind(this.movementController)
            )
            .get('/details', async (req, res) => {
                try {
                    const { id } = req.query;
                    
                    if (!id) {
                        return res.status(400).json({
                            success: false,
                            error: 'ID do movimento é obrigatório'
                        });
                    }

                    const movementId = parseInt(id, 10);
                    const result = await this.movementController.getMovementDetails(movementId);

                    return res.json(result);
                } catch (error) {
                    logger.error('Erro ao buscar detalhes do movimento', { 
                        error: error.message, 
                        stack: error.stack 
                    });

                    return res.status(500).json({
                        success: false,
                        error: 'Erro interno ao buscar detalhes do movimento'
                    });
                }
            })
            .get('/:movementId/detailed', (req, res, next) => {
                console.log('Rota detailed acessada:', {
                    movementId: req.params.movementId,
                    headers: req.headers,
                    body: req.body,
                    query: req.query
                });
                next();
            }, this.movementController.getDetailedMovement.bind(this.movementController))
            .post('/:id/boletos', 
                this.movementController.createBoletos.bind(this.movementController)
            )
            .post('/:id/cancel', this.movementController.cancel.bind(this.movementController))
            .post('/:id/nfse', 
                this.movementController.createMovementNFSe.bind(this.movementController)
            )
            .post('/:id/notify-billing', 
                this.movementController.notifyBilling.bind(this.movementController)
            );

        // Adiciona rotas de items
        this.router.use('/:id/items', movementItemRoutes(this.movementController));
    }

    getRouter() {
        return this.router;
    }
}

module.exports = (dependencies = {}) => {
    return new MovementRoutes(dependencies).getRouter();
};
