const { Router } = require('express');
const { validateRequest } = require('../../middlewares/requestValidator');
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

    // Adiciona rotas de items
    router.use('/', movementItemRoutes());

    return router;
};
