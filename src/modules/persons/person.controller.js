const { Router } = require('express');
const { logger } = require('../../middlewares/logger');

class PersonController {
    constructor({ personService }) {
        this.personService = personService;
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.get('/:id', this.findById.bind(this));
        this.router.get('/:id/contacts', this.findContacts.bind(this));
    }

    async findById(req, res, next) {
        try {
            const { id } = req.params;
            const person = await this.personService.findById(id);
            
            if (!person) {
                return res.status(404).json({ message: 'Pessoa não encontrada' });
            }

            res.json(person);
        } catch (error) {
            logger.error('Erro ao buscar pessoa por ID no controller', {
                error: error.message,
                params: req.params
            });
            next(error);
        }
    }

    async findContacts(req, res, next) {
        try {
            const { id } = req.params;
            const contacts = await this.personService.findContacts(id);
            res.json(contacts);
        } catch (error) {
            logger.error('Erro ao buscar contatos da pessoa no controller', {
                error: error.message,
                params: req.params
            });
            next(error);
        }
    }
}

module.exports = PersonController;
