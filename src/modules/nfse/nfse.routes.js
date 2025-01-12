const { Router } = require('express');
const { validateRequest } = require('../../middlewares/requestValidator');
const { 
    listNFSeSchema, 
    createNFSeSchema, 
    updateStatusSchema, 
    cancelNFSeSchema 
} = require('./validators/nfse.validator');
const { logger } = require('../../middlewares/logger');

/**
 * @param {NFSeController} controller 
 */
module.exports = (controller) => {
    logger.info('NFSeRoutes: Configurando rotas', {
        controllerMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(controller))
    });

    const router = Router();

    // Middleware de log para todas as rotas
    router.use((req, res, next) => {
        logger.info('Requisição NFSe recebida', {
            method: req.method,
            path: req.path,
            body: req.body,
            params: req.params,
            query: req.query
        });
        next();
    });

    // Rotas de NFSe
    router.get('/', 
        validateRequest(listNFSeSchema, 'query'),
        controller.index.bind(controller)
    );

    router.post('/', 
        validateRequest(createNFSeSchema, 'body'),
        controller.create.bind(controller)
    );

    router.get('/:id', 
        controller.show.bind(controller)
    );

    router.patch('/:id/status', 
        validateRequest(updateStatusSchema, 'body'),
        controller.updateStatus.bind(controller)
    );

    router.post('/:id/cancel', 
        validateRequest(cancelNFSeSchema, 'body'),
        controller.cancel.bind(controller)
    );

    return router;
};
