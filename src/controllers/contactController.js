const contactService = require('../services/contactService');
const { handleResponse, handleError } = require('../utils/responseHandler');
const { logger } = require('../middlewares/logger');

class ContactController {
    async index(req, res) {
        try {
            logger.info('Iniciando listagem de contatos', {
                query: req.query
            });
            
            const { page, limit, ...filters } = req.query;
            const result = await contactService.listContacts(page, limit, filters);
            
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
            const contact = await contactService.getContact(id);
            handleResponse(res, 200, { data: contact });
        } catch (error) {
            handleError(res, error);
        }
    }

    async store(req, res) {
        try {
            const contactData = req.body;
            const newContact = await contactService.createContact(contactData);
            handleResponse(res, 201, { data: newContact });
        } catch (error) {
            handleError(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const contactData = req.body;
            const updatedContact = await contactService.updateContact(id, contactData);
            handleResponse(res, 200, { data: updatedContact });
        } catch (error) {
            handleError(res, error);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await contactService.deleteContact(id);
            handleResponse(res, 204);
        } catch (error) {
            handleError(res, error);
        }
    }
}

module.exports = new ContactController();
