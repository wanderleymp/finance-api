const personService = require('../services/personService');
const { handleResponse, handleError } = require('../utils/responseHandler');
const { logger } = require('../middlewares/logger');

class PersonController {
    async index(req, res) {
        try {
            logger.info('Iniciando listagem de pessoas');
            const persons = await personService.listPersons();
            logger.info('Listagem de pessoas concluída', { 
                count: persons.length, 
                persons: persons.map(person => ({ id: person.id, name: person.name })) 
            });
            handleResponse(res, persons);
        } catch (error) {
            logger.error('Erro na listagem de pessoas', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            handleError(res, error);
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;
            const person = await personService.getPerson(id);
            handleResponse(res, person);
        } catch (error) {
            handleError(res, error);
        }
    }

    async store(req, res) {
        try {
            const personData = req.body;
            const newPerson = await personService.createPerson(personData);
            handleResponse(res, newPerson, 201);
        } catch (error) {
            handleError(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const personData = req.body;
            const updatedPerson = await personService.updatePerson(id, personData);
            handleResponse(res, updatedPerson);
        } catch (error) {
            handleError(res, error);
        }
    }

    async destroy(req, res) {
        try {
            const { id } = req.params;
            await personService.deletePerson(id);
            handleResponse(res, null, 204);
        } catch (error) {
            handleError(res, error);
        }
    }
}

module.exports = new PersonController();
