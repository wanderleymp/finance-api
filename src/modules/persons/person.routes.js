const { Router } = require('express');
const PersonController = require('./person.controller');
const authMiddleware = require('../../middlewares/authMiddleware');
const { validateRequest } = require('../../middlewares/validationMiddleware');
const { 
    createPersonSchema, 
    updatePersonSchema 
} = require('./schemas/person.schema');

const addressSchema = require('../addresses/schemas/address.schema');
const contactSchema = require('../contacts/schemas/contact.schema');

class PersonRoutes {
    constructor(personController = new PersonController()) {
        this.router = Router();
        this.personController = personController;
        this.setupRoutes();
    }

    setupRoutes() {
        // Rotas públicas
        this.router.get('/', 
            authMiddleware, 
            this.personController.findAll.bind(this.personController)
        );

        this.router.get('/:id', 
            authMiddleware, 
            this.personController.findById.bind(this.personController)
        );

        this.router.get('/:id/details', 
            authMiddleware, 
            this.personController.findPersonWithDetails.bind(this.personController)
        );

        // Rotas protegidas com validação
        this.router.post('/', 
            authMiddleware,
            validateRequest(createPersonSchema),
            this.personController.create.bind(this.personController)
        );

        this.router.put('/:id', 
            authMiddleware,
            validateRequest(updatePersonSchema),
            this.personController.update.bind(this.personController)
        );

        this.router.delete('/:id', 
            authMiddleware, 
            this.personController.delete.bind(this.personController)
        );

        // Rotas de endereços
        this.router.post('/:id/addresses', 
            authMiddleware,
            validateRequest(addressSchema),
            this.personController.addAddress.bind(this.personController)
        );

        this.router.delete('/addresses/:addressId', 
            authMiddleware,
            this.personController.removeAddress.bind(this.personController)
        );

        // Rotas de contatos
        this.router.post('/:id/contacts', 
            authMiddleware,
            validateRequest(contactSchema),
            this.personController.addContact.bind(this.personController)
        );

        this.router.delete('/contacts/:contactId', 
            authMiddleware,
            this.personController.removeContact.bind(this.personController)
        );

        return this.router;
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new PersonRoutes();
