const express = require('express');
const { validateRequest } = require('../../middlewares/requestValidator');
const { authMiddleware } = require('../../middlewares/auth');
const installmentSchema = require('./schemas/installment.schema');

/**
 * @param {import('./installment.controller')} installmentController 
 */
module.exports = (installmentController) => {
    const router = express.Router();

    // Middleware de autenticação para todas as rotas
    router.use(authMiddleware);

    // Rotas
    router.get('/', 
        validateRequest(installmentSchema.listInstallments, 'query'),
        installmentController.index.bind(installmentController)
    );

    router.get('/:id',
        validateRequest(installmentSchema.getInstallmentById, 'params'),
        installmentController.show.bind(installmentController)
    );

    return router;
};