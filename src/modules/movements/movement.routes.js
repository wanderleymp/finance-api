const { Router } = require('express');
const { validateRequest } = require('../../middlewares/requestValidator');
const { authMiddleware } = require('../../middlewares/auth');
const { 
    listMovementsSchema,
    createMovementSchema,
    updateMovementSchema,
    updateStatusSchema
} = require('./validators/movement.validator');

/**
 * @param {MovementController} controller 
 */
module.exports = (controller) => {
    const router = Router();

    // Middleware de autenticação para todas as rotas
    router.use(authMiddleware);

    router.get('/', 
        validateRequest(listMovementsSchema, 'query'),
        controller.index.bind(controller)
    );

    router.get('/:id', 
        controller.show.bind(controller)
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

    return router;
};
