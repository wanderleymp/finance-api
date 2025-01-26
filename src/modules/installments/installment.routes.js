const express = require('express');
const { validateRequest } = require('../../middlewares/requestValidator');
const { authMiddleware } = require('../../middlewares/auth');
const installmentSchema = require('./schemas/installment.schema');

/**
 * @param {import('./installment.controller')} installmentController 
 */
module.exports = (installmentController) => {
    const router = express.Router();

    // Log de debug para todas as rotas
    router.use((req, res, next) => {
        console.log('Installments Route Debug:', {
            method: req.method,
            path: req.path,
            originalUrl: req.originalUrl,
            body: req.body,
            params: req.params,
            query: req.query
        });
        next();
    });

    // Middleware de autenticação para todas as rotas
    router.use(authMiddleware);

    // Rotas
    router.get('/', 
        validateRequest(installmentSchema.listInstallments, 'query'),
        installmentController.index.bind(installmentController)
    );

    router.get('/details', 
        validateRequest(installmentSchema.listInstallments, 'query'),
        installmentController.findDetails.bind(installmentController)
    );

    router.get('/:id',
        validateRequest(installmentSchema.getInstallmentById, 'params'),
        installmentController.show.bind(installmentController)
    );

    router.get('/:id/details',
        validateRequest(installmentSchema.getInstallmentById, 'params'),
        installmentController.showDetails.bind(installmentController)
    );

    router.post('/:id/boletos',
        validateRequest(installmentSchema.generateBoleto, 'params'),
        installmentController.generateBoleto.bind(installmentController)
    );

    // Atualiza a data de vencimento de uma parcela
    router.patch('/:id/due-date', 
        validateRequest(installmentSchema.updateDueDate, 'params'),
        installmentController.updateDueDate.bind(installmentController)
    );

    // Atualiza o valor de uma parcela
    router.patch('/:id', 
        validateRequest(installmentSchema.updateInstallment, 'params'),
        validateRequest(installmentSchema.updateInstallment, 'body'),
        installmentController.updateInstallment.bind(installmentController)
    );

    // Registra o pagamento de uma parcela
    router.put('/:id/payment',
        validateRequest(installmentSchema.registerPaymentParams, 'params'),
        validateRequest(installmentSchema.registerPayment, 'body'),
        installmentController.registerPayment.bind(installmentController)
    );

    // Cancela boletos de uma parcela
    router.put('/:id/boleto/cancelar', 
        authMiddleware,
        validateRequest(installmentSchema.cancelBoletos),
        installmentController.cancelInstallmentBoletos.bind(installmentController)
    );

    return router;
};
