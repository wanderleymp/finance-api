const { logger } = require('../../middlewares/logger');
const ContactService = require('./contact.service');
const { handleResponse, handleError } = require('../../utils/responseHandler');

class ContactController {
    constructor(contactService = new ContactService()) {
        this.contactService = contactService;
    }

    async findAll(req, res) {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;

            const result = await this.contactService.findAll(
                parseInt(page), 
                parseInt(limit),
                filters
            );

            return handleResponse(res, result);
        } catch (error) {
            logger.error('Erro ao buscar contatos', {
                error: error.message,
                query: req.query
            });
            return handleError(res, error);
        }
    }

    async findById(req, res) {
        try {
            const { id } = req.params;
            const contact = await this.contactService.findById(parseInt(id));

            if (!contact) {
                return handleError(res, new Error('Contato não encontrado'), 404);
            }

            return handleResponse(res, contact);
        } catch (error) {
            logger.error('Erro ao buscar contato por ID', {
                error: error.message,
                id: req.params.id
            });
            return handleError(res, error);
        }
    }

    async findByPersonId(req, res) {
        try {
            const { personId } = req.params;
            const contacts = await this.contactService.findByPersonId(parseInt(personId));

            return handleResponse(res, contacts);
        } catch (error) {
            logger.error('Erro ao buscar contatos por pessoa', {
                error: error.message,
                personId: req.params.personId
            });
            return handleError(res, error);
        }
    }

    async findMainContactByPersonId(req, res) {
        try {
            const { personId } = req.params;

            const mainContact = await this.contactService.findMainContactByPersonId(parseInt(personId));

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

    async create(req, res) {
        try {
            const contactData = req.body;

            const newContact = await this.contactService.create(contactData, req);

            return handleResponse(res, newContact, 201);
        } catch (error) {
            logger.error('Erro ao criar contato', {
                error: error.message,
                body: req.body
            });
            return handleError(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const contactData = req.body;

            const updatedContact = await this.contactService.update(
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

    async delete(req, res) {
        try {
            const { id } = req.params;

            const deletedContact = await this.contactService.delete(
                parseInt(id), 
                req
            );

            return handleResponse(res, deletedContact);
        } catch (error) {
            logger.error('Erro ao deletar contato', {
                error: error.message,
                params: req.params
            });
            return handleError(res, error);
        }
    }
}

module.exports = ContactController;
