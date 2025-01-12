const express = require('express');
const InvoiceEventController = require('./invoice-event.controller');
const { authMiddleware } = require('../../middlewares/auth');

class InvoiceEventRoutes {
    constructor(controller) {
        this.router = express.Router();
        this.controller = controller;
        this.initRoutes();
    }

    initRoutes() {
        // Middleware de autenticação para todas as rotas
        this.router.use(authMiddleware);

        // Buscar todos os eventos
        this.router.get('/', 
            this.controller.findAll.bind(this.controller)
        );

        // Buscar evento por ID
        this.router.get('/:id', 
            this.controller.findById.bind(this.controller)
        );

        // Buscar eventos por ID da invoice
        this.router.get('/invoice/:invoiceId', 
            this.controller.findByInvoiceId.bind(this.controller)
        );

        // Criar novo evento
        this.router.post('/', 
            this.controller.create.bind(this.controller)
        );

        // Atualizar evento
        this.router.put('/:id', 
            this.controller.update.bind(this.controller)
        );

        // Remover evento
        this.router.delete('/:id', 
            this.controller.delete.bind(this.controller)
        );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = InvoiceEventRoutes;
