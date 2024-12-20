const express = require('express');
const { validateRequest } = require('../../middlewares/requestValidator');
const { authMiddleware } = require('../../middlewares/auth');
const movementPaymentSchema = require('./schemas/movement-payment.schema');

/**
 * @param {import('./movement-payment.controller')} movementPaymentController 
 */
module.exports = (movementPaymentController) => {
    const router = express.Router();

    // Middleware de autenticação para todas as rotas
    router.use(authMiddleware);

    // Rotas
    router.get('/', 
        validateRequest(movementPaymentSchema.listPayments, 'query'),
        movementPaymentController.index.bind(movementPaymentController)
    );

    router.get('/:id',
        validateRequest(movementPaymentSchema.getPaymentById, 'params'),
        movementPaymentController.show.bind(movementPaymentController)
    );

    return router;
};
