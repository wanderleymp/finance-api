const express = require('express');
const { authMiddleware } = require('../../middlewares/auth');
const { validateRequest } = require('../../middlewares/requestValidator');
const { 
    listNFSeSchema, 
    createNFSeSchema, 
    updateStatusSchema, 
    cancelNFSeSchema 
} = require('./validators/nfse.validator');
const { logger } = require('../../middlewares/logger');

module.exports = (controller) => {
    const router = express.Router();

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

    // Middleware de autenticação para todas as rotas
    router.use(authMiddleware);

    // Buscar todos os NFSes
    router.get('/', 
        validateRequest(listNFSeSchema, 'query'),
        controller.findAll.bind(controller)
    );

    // Buscar NFSe por ID
    router.get('/:id', 
        controller.findById.bind(controller)
    );

    // Buscar NFSes por ID da invoice
    router.get('/invoice/:invoiceId', 
        controller.findByInvoiceId.bind(controller)
    );

    // Buscar NFSes por ID de integração
    router.get('/integration/:integrationId', 
        controller.findByIntegrationId.bind(controller)
    );

    // Criar novo NFSe
    router.post('/', 
        validateRequest(createNFSeSchema, 'body'),
        controller.create.bind(controller)
    );

    // Criar NFSe
    router.post('/criar-nfse', 
        validateRequest(createNFSeSchema, 'body'),
        controller.criarNfse.bind(controller)
    );

    // Emitir NFSe
    router.post('/emitir', 
        validateRequest(createNFSeSchema, 'body'),
        controller.emitirNfse.bind(controller)
    );

    // Criar NFSe a partir do retorno da Nuvem Fiscal
    router.post('/criar-nfse', 
        validateRequest(createNFSeSchema, 'body'),
        controller.criarNfseComRetorno.bind(controller)
    );

    // Atualizar status do NFSe
    router.patch('/:id/status', 
        validateRequest(updateStatusSchema, 'body'),
        controller.update.bind(controller)
    );

    // Cancelar NFSe
    router.post('/:id/cancel', 
        validateRequest(cancelNFSeSchema, 'body'),
        controller.update.bind(controller)
    );

    // Remover NFSe
    router.delete('/:id', 
        controller.delete.bind(controller)
    );

    return router;
};
