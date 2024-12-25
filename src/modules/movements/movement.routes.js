const { Router } = require('express');
const { validateRequest } = require('../../middlewares/requestValidator');
const { logger } = require('../../middlewares/logger');
const { 
    listMovementsSchema,
    createMovementSchema,
    updateMovementSchema,
    updateStatusSchema
} = require('./validators/movement.validator');
const movementItemRoutes = require('./movement-items.routes');

/**
 * @param {MovementController} controller 
 */
module.exports = (controller) => {
    const router = Router();

    // Middleware de log para todas as rotas
    router.use((req, res, next) => {
        logger.info('Requisição recebida', {
            method: req.method,
            path: req.path,
            body: req.body,
            params: req.params,
            query: req.query
        });
        next();
    });

    // Rotas de movimento
    router.get('/', 
        validateRequest(listMovementsSchema, 'query'),
        controller.index.bind(controller)
    );

    router.get('/:id', 
        controller.show.bind(controller)
    );

    router.get('/:id/payments',
        controller.listPayments.bind(controller)
    );

    router.get('/:id/payments/:paymentId/installments',
        controller.listPaymentInstallments.bind(controller)
    );

    router.post('/:id/payments',
        controller.createPayment.bind(controller)
    );

    router.delete('/:id/payments/:paymentId',
        controller.deletePayment.bind(controller)
    );

    router.post('/', 
        validateRequest(createMovementSchema),
        controller.create.bind(controller)
    );

    router.put('/:id', 
        validateRequest(updateMovementSchema),
        controller.update.bind(controller)
    );

    router.delete('/:id', 
        controller.delete.bind(controller)
    );

    router.patch('/:id/status', 
        validateRequest(updateStatusSchema),
        controller.updateStatus.bind(controller)
    );

    // Nova rota para billing
    router.post('/:id/billing',
        controller.sendBillingMessage.bind(controller)
    );

    // Adiciona rotas de items
    router.use('/:id/items', movementItemRoutes(controller));

    return router;
};
