const personContactService = require('../services/personContactService');
const { handleResponse, handleError } = require('../utils/responseHandler');
const { logger } = require('../middlewares/logger');

class PersonContactController {
    async index(req, res) {
        try {
            logger.info('Iniciando listagem de contatos', {
                query: req.query
            });
            
            const { page, limit, ...filters } = req.query;
            const result = await personContactService.listContacts(page, limit, filters);
            
            logger.info('Listagem de contatos concluída', { 
                count: result.data.length,
                currentPage: result.meta.current_page,
                totalRecords: result.meta.total
            });
            
            handleResponse(res, 200, result);
        } catch (error) {
            logger.error('Erro na listagem de contatos', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            handleError(res, error);
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;
            const contact = await personContactService.getContact(id);
            handleResponse(res, 200, { data: contact });
        } catch (error) {
            handleError(res, error);
        }
    }

    async store(req, res) {
        try {
            const contactData = req.body;
            const newContact = await personContactService.createContact(contactData);
            handleResponse(res, 201, { data: newContact });
        } catch (error) {
            handleError(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const contactData = req.body;
            const updatedContact = await personContactService.updateContact(id, contactData);
            handleResponse(res, 200, { data: updatedContact });
        } catch (error) {
            handleError(res, error);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await personContactService.deleteContact(id);
            handleResponse(res, 204);
        } catch (error) {
            handleError(res, error);
        }
    }
}

module.exports = new PersonContactController();
