const { logger } = require('../../middlewares/logger');
const PersonContactService = require('./person-contact.service');
const { handleResponse, handleError } = require('../../utils/responseHandler');

class PersonContactController {
    constructor(personContactService = new PersonContactService()) {
        this.personContactService = personContactService;
    }

    /**
     * Lista contatos de uma pessoa
     */
    async findByPersonId(req, res) {
        try {
            const { personId } = req.params;

            const contacts = await this.personContactService.findByPersonId(
                parseInt(personId)
            );

            return handleResponse(res, contacts);
        } catch (error) {
            logger.error('Erro ao buscar contatos da pessoa', {
                error: error.message,
                params: req.params
            });
            return handleError(res, error);
        }
    }

    /**
     * Busca contato principal de uma pessoa
     */
    async findMainContactByPersonId(req, res) {
        try {
            const { personId } = req.params;

            const mainContact = await this.personContactService.findMainContactByPersonId(
                parseInt(personId)
            );

            if (!mainContact) {
                return handleError(res, new Error('Contato principal não encontrado'), 404);
            }

            return handleResponse(res, mainContact);
        } catch (error) {
            logger.error('Erro ao buscar contato principal da pessoa', {
                error: error.message,
                params: req.params
            });
            return handleError(res, error);
        }
    }

    /**
     * Cria um novo contato
     */
    async create(req, res) {
        try {
            const contactData = req.body;

            const newContact = await this.personContactService.create(
                contactData, 
                req
            );

            return handleResponse(res, newContact, 201);
        } catch (error) {
            logger.error('Erro ao criar contato', {
                error: error.message,
                body: req.body
            });
            return handleError(res, error);
        }
    }

    /**
     * Atualiza um contato
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const contactData = req.body;

            const updatedContact = await this.personContactService.update(
                parseInt(id), 
                contactData, 
                req
            );

            return handleResponse(res, updatedContact);
        } catch (error) {
            logger.error('Erro ao atualizar contato', {
                error: error.message,
                params: req.params,
                body: req.body
            });
            return handleError(res, error);
        }
    }

    /**
     * Remove um contato
     */
    async delete(req, res) {
        try {
            const { id } = req.params;

            const deletedContact = await this.personContactService.delete(
                parseInt(id), 
                req
            );

            return handleResponse(res, deletedContact);
        } catch (error) {
            logger.error('Erro ao remover contato', {
                error: error.message,
                params: req.params
            });
            return handleError(res, error);
        }
    }
}

module.exports = PersonContactController;
