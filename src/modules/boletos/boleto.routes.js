const express = require('express');
const { validateRequest } = require('../../middlewares/requestValidator');
const { authMiddleware } = require('../../middlewares/auth');
const boletoSchema = require('./schemas/boleto.schema');

/**
 * @param {import('./boleto.controller')} boletoController 
 */
module.exports = (boletoController) => {
    const router = express.Router();

    // Middleware de autenticação para todas as rotas
    router.use(authMiddleware);

    // Rotas
    router.get('/', 
        validateRequest(boletoSchema.listBoletos, 'query'),
        boletoController.index.bind(boletoController)
    );

    router.get('/:id',
        validateRequest(boletoSchema.getBoletoById, 'params'),
        boletoController.show.bind(boletoController)
    );

    router.post('/',
        validateRequest(boletoSchema.createBoleto, 'body'),
        boletoController.store.bind(boletoController)
    );

    router.put('/:id',
        validateRequest(boletoSchema.updateBoleto, 'body'),
        validateRequest(boletoSchema.getBoletoById, 'params'),
        boletoController.update.bind(boletoController)
    );

    router.post('/:id/cancel',
        validateRequest(boletoSchema.cancelBoleto, 'body'),
        validateRequest(boletoSchema.getBoletoById, 'params'),
        boletoController.cancel.bind(boletoController)
    );

    router.post('/movimento/:movimentoId',
        validateRequest(boletoSchema.emitirBoletos, 'body'),
        validateRequest(boletoSchema.getMovimentoId, 'params'),
        boletoController.emitirBoletos.bind(boletoController)
    );

    return router;
};
