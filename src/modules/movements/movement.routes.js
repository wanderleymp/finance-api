const express = require('express');
const { validateRequest } = require('../../middlewares/requestValidator');
const { authMiddleware } = require('../../middlewares/auth');
const movementSchema = require('./schemas/movement.schema');

/**
 * @param {import('./movement.controller')} movementController 
 */
module.exports = (movementController) => {
    const router = express.Router();

    // Middleware de autenticação para todas as rotas
    router.use(authMiddleware);

    // Rotas
    router.get('/', 
        validateRequest(movementSchema.listMovements, 'query'),
        movementController.index.bind(movementController)
    );

    router.get('/:id',
        validateRequest(movementSchema.getMovementById, 'params'),
        movementController.show.bind(movementController)
    );

    return router;
};
