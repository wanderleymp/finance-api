const { Router } = require('express');
const PersonContactController = require('./person-contact.controller');
const authMiddleware = require('../../middlewares/authMiddleware');
const { validateRequest } = require('../../middlewares/validationMiddleware');
const CreatePersonContactDTO = require('./dto/create-person-contact.dto');
const UpdatePersonContactDTO = require('./dto/update-person-contact.dto');

class PersonContactRoutes {
    constructor(personContactController = new PersonContactController()) {
        this.router = Router();
        this.personContactController = personContactController;
        this.setupRoutes();
    }

    setupRoutes() {
        // Busca contatos de uma pessoa
        this.router.get('/person/:personId', 
            authMiddleware,
            this.personContactController.findByPersonId.bind(this.personContactController)
        );

        // Busca contato principal de uma pessoa
        this.router.get('/person/:personId/main', 
            authMiddleware,
            this.personContactController.findMainContactByPersonId.bind(this.personContactController)
        );

        // Cria um novo contato
        this.router.post('/', 
            authMiddleware,
            validateRequest(CreatePersonContactDTO.schema),
            this.personContactController.create.bind(this.personContactController)
        );

        // Atualiza um contato
        this.router.put('/:id', 
            authMiddleware,
            validateRequest(UpdatePersonContactDTO.schema),
            this.personContactController.update.bind(this.personContactController)
        );

        // Remove um contato
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
