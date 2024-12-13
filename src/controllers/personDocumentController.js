const personDocumentService = require('../services/personDocumentService');
const { handleResponse, handleError } = require('../utils/responseHandler');
const { logger } = require('../middlewares/logger');

class PersonDocumentController {
    async index(req, res) {
        try {
            logger.info('Iniciando listagem de documentos');
            const { page, limit, ...filters } = req.query;
            const result = await personDocumentService.listDocuments(page, limit, filters);
            
            logger.info('Listagem de documentos concluída', { 
                count: result.data.length,
                currentPage: result.meta.current_page,
                totalRecords: result.meta.total
            });
            
            handleResponse(res, 200, result);
        } catch (error) {
            logger.error('Erro na listagem de documentos', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            handleError(res, error);
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;
            const document = await personDocumentService.getDocument(id);
            handleResponse(res, 200, { data: document });
        } catch (error) {
            handleError(res, error);
        }
    }

    async store(req, res) {
        try {
            const documentData = req.body;
            const newDocument = await personDocumentService.createDocument(documentData);
            handleResponse(res, 201, { data: newDocument });
        } catch (error) {
            handleError(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const documentData = req.body;
            const updatedDocument = await personDocumentService.updateDocument(id, documentData);
            handleResponse(res, 200, { data: updatedDocument });
        } catch (error) {
            handleError(res, error);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await personDocumentService.deleteDocument(id);
            handleResponse(res, 204);
        } catch (error) {
            handleError(res, error);
        }
    }

    async getPersonDocuments(req, res) {
        try {
            const { personId } = req.params;
            const documents = await personDocumentService.getPersonDocuments(personId);
            handleResponse(res, 200, { data: documents });
        } catch (error) {
            handleError(res, error);
        }
    }
}

module.exports = new PersonDocumentController();
