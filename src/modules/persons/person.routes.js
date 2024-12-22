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
        // Todas as rotas são protegidas
        this.router.use(authMiddleware);

        // Rotas RESTful básicas
        this.router
            .get('/', 
                this.personController.findAll.bind(this.personController)
            )
            .get('/:id', 
                this.personController.findById.bind(this.personController)
            )
            .get('/:id/details', 
                this.personController.findPersonWithDetails.bind(this.personController)
            )
            .post('/', 
                (req, res, next) => validateSchema(createPersonSchema, req.body)
                    .then(validatedData => {
                        req.body = validatedData;
                        next();
                    })
                    .catch(next),
                this.personController.create.bind(this.personController)
            )
            .put('/:id', 
                (req, res, next) => validateSchema(updatePersonSchema, req.body)
                    .then(validatedData => {
                        req.body = validatedData;
                        next();
                    })
                    .catch(next),
                this.personController.update.bind(this.personController)
            )
            .delete('/:id', 
                this.personController.delete.bind(this.personController)
            );

        // Rotas de documentos
        this.router
            .get('/:id/documents', 
                this.personController.getDocuments.bind(this.personController)
            );

        // Rotas de endereços
        this.router
            .get('/:id/addresses', 
                this.personController.getAddresses.bind(this.personController)
            )
            .post('/:id/addresses', 
                (req, res, next) => validateSchema(addressSchema.create, req.body)
                    .then(validatedData => {
                        req.body = validatedData;
                        next();
                    })
                    .catch(next),
                this.personController.addAddress.bind(this.personController)
            )
            .delete('/addresses/:addressId', 
                this.personController.removeAddress.bind(this.personController)
            );

        // Rotas de contatos
        this.router
            .get('/:id/contacts', 
                this.personController.getContacts.bind(this.personController)
            )
            .post('/:id/contacts', 
                (req, res, next) => validateSchema(contactSchema.create, req.body)
                    .then(validatedData => {
                        req.body = validatedData;
                        next();
                    })
                    .catch(next),
                this.personController.addContact.bind(this.personController)
            )
            .delete('/contacts/:contactId', 
                this.personController.removeContact.bind(this.personController)
            );

        // Rotas de licenças
        this.router
            .get('/:id/licenses', 
                this.personController.getLicenses.bind(this.personController)
            )
            .post('/:id/licenses', 
                this.personController.addLicense.bind(this.personController)
            )
            .delete('/licenses/:licenseId', 
                this.personController.removeLicense.bind(this.personController)
            );

        // Rotas de validação de CNPJ
        this.router
            .post('/validate-cnpj', 
                this.personController.validateCnpj.bind(this.personController)
            )
            .get('/search-cnpj/:cnpj', 
                this.personController.searchCnpj.bind(this.personController)
            );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new PersonRoutes();
