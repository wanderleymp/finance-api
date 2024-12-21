const { Router } = require('express');
const { validateRequest } = require('../../middlewares/requestValidator');
const { authMiddleware } = require('../../middlewares/auth');
const movementPaymentSchema = require('./schemas/movement-payment.schema');

/**
 * @param {import('./movement-payment.controller')} controller 
 */
module.exports = (controller) => {
    const router = Router();

    // Middleware de autenticação para todas as rotas
    router.use(authMiddleware);

    router.get('/', 
        validateRequest(movementPaymentSchema.list, 'query'),
        controller.index.bind(controller)
    );

    router.get('/:id', 
        validateRequest(movementPaymentSchema.getById, 'params'),
        controller.show.bind(controller)
    );

    router.post('/', 
        validateRequest(movementPaymentSchema.create),
        controller.store.bind(controller)
    );

    router.put('/:id', 
        validateRequest(movementPaymentSchema.update),
        controller.update.bind(controller)
    );

    router.delete('/:id', 
        validateRequest(movementPaymentSchema.delete, 'params'),
        controller.destroy.bind(controller)
    );

    return router;
};
