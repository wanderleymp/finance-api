const { Router } = require('express');
const PersonContactController = require('./person-contact.controller');
const { authMiddleware } = require('../../middlewares/auth');

class PersonContactRoutes {
    constructor(personContactController = new PersonContactController()) {
        this.router = Router();
        this.personContactController = personContactController;
        this.setupRoutes();
    }

    setupRoutes() {
        // Lista todos os person-contacts com paginação
        this.router.get('/',
            authMiddleware,
            this.personContactController.findAll.bind(this.personContactController)
        );

        // Busca um person-contact específico
        this.router.get('/:id',
            authMiddleware,
            this.personContactController.findById.bind(this.personContactController)
        );

        // Lista contatos de uma pessoa com paginação
        this.router.get('/person/:personId', 
            authMiddleware,
            this.personContactController.findByPersonId.bind(this.personContactController)
        );

        // Cria um novo person-contact
        this.router.post('/:personId/contact/:contactId', 
            authMiddleware,
            this.personContactController.create.bind(this.personContactController)
        );

        // Remove um person-contact
        this.router.delete('/:id', 
            authMiddleware,
            this.personContactController.delete.bind(this.personContactController)
        );

        return this.router;
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new PersonContactRoutes();
