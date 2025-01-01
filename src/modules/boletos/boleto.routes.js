const { Router } = require('express');
const { validateRequest } = require('../../middlewares/requestValidator');
const { authMiddleware } = require('../../middlewares/auth');
const { logger } = require('../../middlewares/logger');
const boletoSchema = require('./schemas/boleto.schema');

/**
 * @param {import('./boleto.controller')} boletoController 
 */
module.exports = (boletoController) => {
    const router = Router();

    // Middleware de autenticação para todas as rotas
    router.use(authMiddleware);

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

    // Rotas
    router.get('/',
        validateRequest(boletoSchema.listBoletos, 'query'),
        boletoController.index.bind(boletoController)
    );

    router.get('/details',
        validateRequest(boletoSchema.listBoletos, 'query'),
        boletoController.listWithDetails.bind(boletoController)
    );

    router.get('/:id',
        validateRequest(boletoSchema.getBoletoById, 'params'),
        boletoController.show.bind(boletoController)
    );

    router.get('/:id/details',
        validateRequest(boletoSchema.getBoletoById, 'params'),
        boletoController.showWithDetails.bind(boletoController)
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

    return router;
};
