const { Router } = require('express');
const PersonController = require('./person.controller');
const { authMiddleware } = require('../../middlewares/auth');
const { validateSchema } = require('../../utils/validateSchema');
const { 
    createPersonSchema, 
    updatePersonSchema 
} = require('./schemas/person.schema');

const addressSchema = require('../addresses/schemas/address.schema');
const contactSchema = require('../contacts/schemas/contact.schema');

class PersonRoutes {
    constructor() {
        this.router = Router();
        this.personController = new PersonController();
        this.setupRoutes();
    }

    setupRoutes() {
        // Rotas públicas
        this.router.get('/', this.personController.findAll.bind(this.personController));
        this.router.get('/:id', this.personController.findById.bind(this.personController));
        this.router.get('/:id/details', this.personController.findPersonWithDetails.bind(this.personController));

        // Rotas protegidas com validação
        this.router.post('/', 
            authMiddleware,
            (req, res, next) => validateSchema(createPersonSchema, req.body)
                .then(validatedData => {
                    req.body = validatedData;
                    next();
                })
                .catch(next),
            this.personController.create.bind(this.personController)
        );

        this.router.put('/:id', 
            authMiddleware,
            (req, res, next) => validateSchema(updatePersonSchema, req.body)
                .then(validatedData => {
                    req.body = validatedData;
                    next();
                })
                .catch(next),
            this.personController.update.bind(this.personController)
        );

        this.router.delete('/:id', 
            authMiddleware,
            this.personController.delete.bind(this.personController)
        );

        // Rotas de endereços
        this.router.post('/:id/addresses', 
            authMiddleware,
            (req, res, next) => validateSchema(addressSchema.create, req.body)
                .then(validatedData => {
                    req.body = validatedData;
                    next();
                })
                .catch(next),
            this.personController.addAddress.bind(this.personController)
        );

        this.router.delete('/addresses/:addressId', 
            authMiddleware,
            this.personController.removeAddress.bind(this.personController)
        );

        // Rotas de contatos
        this.router.post('/:id/contacts', 
            authMiddleware,
            (req, res, next) => validateSchema(contactSchema.create, req.body)
                .then(validatedData => {
                    req.body = validatedData;
                    next();
                })
                .catch(next),
            this.personController.addContact.bind(this.personController)
        );

        this.router.delete('/contacts/:contactId', 
            authMiddleware,
            this.personController.removeContact.bind(this.personController)
        );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new PersonRoutes();
