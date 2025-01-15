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

class NfseRoutes {
    constructor(controller) {
        this.router = express.Router();
        this.controller = controller;
        this.initRoutes();
    }

    initRoutes() {
        // Middleware de log para todas as rotas
        this.router.use((req, res, next) => {
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
        this.router.use(authMiddleware);

        // Buscar todos os NFSes
        this.router.get('/', 
            validateRequest(listNFSeSchema, 'query'),
            this.controller.findAll.bind(this.controller)
        );

        // Buscar NFSe por ID
        this.router.get('/:id', 
            this.controller.findById.bind(this.controller)
        );

        // Buscar NFSes por ID da invoice
        this.router.get('/invoice/:invoiceId', 
            this.controller.findByInvoiceId.bind(this.controller)
        );

        // Buscar NFSes por ID de integração
        this.router.get('/integration/:integrationId', 
            this.controller.findByIntegrationId.bind(this.controller)
        );

        // Criar novo NFSe
        this.router.post('/', 
            validateRequest(createNFSeSchema, 'body'),
            this.controller.create.bind(this.controller)
        );

        // Emitir NFSe
        this.router.post('/emitir', 
            validateRequest(createNFSeSchema, 'body'),
            this.controller.emitirNfse.bind(this.controller)
        );

        // Criar NFSe a partir do retorno da Nuvem Fiscal
        this.router.post('/criar-nfse', 
            validateRequest(createNFSeSchema, 'body'),
            this.controller.criarNfseComRetorno.bind(this.controller)
        );

        // Atualizar status do NFSe
        this.router.patch('/:id/status', 
            validateRequest(updateStatusSchema, 'body'),
            this.controller.update.bind(this.controller)
        );

        // Cancelar NFSe
        this.router.post('/:id/cancel', 
            validateRequest(cancelNFSeSchema, 'body'),
            this.controller.update.bind(this.controller)
        );

        // Remover NFSe
        this.router.delete('/:id', 
            this.controller.delete.bind(this.controller)
        );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = NfseRoutes;
