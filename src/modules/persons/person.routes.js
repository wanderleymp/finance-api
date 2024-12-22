const { Router } = require('express');
const PersonController = require('./person.controller');
const { authMiddleware } = require('../../middlewares/auth');
const { validateSchema } = require('../../utils/validateSchema');
const { 
    createPersonSchema, 
    updatePersonSchema 
} = require('./schemas/person.schema');

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
            .get('/:id/documents',
                this.personController.findDocuments.bind(this.personController)
            )
            .get('/:id/contacts',
                this.personController.findContacts.bind(this.personController)
            )
            .get('/:id/addresses',
                this.personController.findAddresses.bind(this.personController)
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
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new PersonRoutes();
