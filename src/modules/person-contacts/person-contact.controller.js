const { logger } = require('../../middlewares/logger');
const PersonContactService = require('./person-contact.service');
const { handleResponse, handleError } = require('../../utils/responseHandler');

class PersonContactController {
    constructor(personContactService = new PersonContactService()) {
        this.personContactService = personContactService;
    }

    /**
     * Lista todos os person-contacts com paginação
     */
    async findAll(req, res) {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;
            const result = await this.personContactService.findAll(
                parseInt(page),
                parseInt(limit),
                filters
            );
            return handleResponse(res, result);
        } catch (error) {
            logger.error('Erro ao listar person-contacts', {
                error: error.message,
                query: req.query
            });
            return handleError(res, error);
        }
    }

    /**
     * Busca um person-contact específico
     */
    async findById(req, res) {
        try {
            const { id } = req.params;
            const result = await this.personContactService.findById(parseInt(id));
            
            if (!result) {
                return handleError(res, new Error('Person-contact não encontrado'), 404);
            }

            return handleResponse(res, result);
        } catch (error) {
            logger.error('Erro ao buscar person-contact', {
                error: error.message,
                id: req.params.id
            });
            return handleError(res, error);
        }
    }

    /**
     * Lista contatos de uma pessoa com paginação
     */
    async findByPersonId(req, res) {
        try {
            const { personId } = req.params;
            const { page = 1, limit = 10 } = req.query;
            
            const result = await this.personContactService.findByPersonId(
                parseInt(personId),
                parseInt(page),
                parseInt(limit)
            );

            return handleResponse(res, result);
        } catch (error) {
            logger.error('Erro ao buscar contatos da pessoa', {
                error: error.message,
                personId: req.params.personId
            });
            return handleError(res, error);
        }
    }

    /**
     * Cria uma nova associação entre pessoa e contato
     */
    async create(req, res) {
        try {
            const { personId, contactId } = req.params;
            
            const result = await this.personContactService.create({
                person_id: parseInt(personId),
                contact_id: parseInt(contactId)
            });

            return handleResponse(res, result, 201);
        } catch (error) {
            logger.error('Erro ao criar person-contact', {
                error: error.message,
                personId: req.params.personId,
                contactId: req.params.contactId
            });
            return handleError(res, error);
        }
    }

    /**
     * Remove uma associação entre pessoa e contato
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            const result = await this.personContactService.delete(parseInt(id));
            
            if (!result) {
                return handleError(res, new Error('Person-contact não encontrado'), 404);
            }

            return handleResponse(res, { message: 'Person-contact removido com sucesso' });
        } catch (error) {
            logger.error('Erro ao deletar person-contact', {
                error: error.message,
                id: req.params.id
            });
            return handleError(res, error);
        }
    }
}

module.exports = PersonContactController;
