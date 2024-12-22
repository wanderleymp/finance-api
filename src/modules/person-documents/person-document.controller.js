const PersonDocumentService = require('./person-document.service');
const { logger } = require('../../middlewares/logger');
const { ValidationError } = require('../../utils/errors');
const { handleResponse, handleError } = require('../../utils/responseHandler');

class PersonDocumentController {
    constructor(service = new PersonDocumentService()) {
        this.service = service;
    }

    async findAll(req, res) {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;
            const result = await this.service.findAll(
                parseInt(page), 
                parseInt(limit), 
                filters
            );
            return handleResponse(res, result);
        } catch (error) {
            logger.error('Erro ao listar documentos', { error });
            return handleError(res, error);
        }
    }

    async findById(req, res) {
        try {
            const { id } = req.params;
            const document = await this.service.findById(parseInt(id));
            
            if (!document) {
                return handleError(res, new Error('Documento não encontrado'), 404);
            }

            return handleResponse(res, document);
        } catch (error) {
            logger.error('Erro ao buscar documento', { error, id: req.params.id });
            return handleError(res, error);
        }
    }

    async findByPersonId(req, res) {
        try {
            const { personId } = req.params;
            const { page = 1, limit = 10 } = req.query;
            
            const documents = await this.service.findByPersonId(
                parseInt(personId), 
                parseInt(page), 
                parseInt(limit)
            );

            return handleResponse(res, documents);
        } catch (error) {
            logger.error('Erro ao buscar documentos da pessoa', { error, personId: req.params.personId });
            return handleError(res, error);
        }
    }

    async create(req, res) {
        try {
            const { personId } = req.params;
            const documentData = req.body;

            const newDocument = await this.service.create(
                parseInt(personId), 
                documentData
            );

            return handleResponse(res, newDocument, 201);
        } catch (error) {
            logger.error('Erro ao criar documento', { error, personId: req.params.personId, body: req.body });
            return handleError(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const documentData = req.body;

            const updatedDocument = await this.service.update(
                parseInt(id), 
                documentData
            );

            if (!updatedDocument) {
                return handleError(res, new Error('Documento não encontrado'), 404);
            }

            return handleResponse(res, updatedDocument);
        } catch (error) {
            logger.error('Erro ao atualizar documento', { error, id: req.params.id, body: req.body });
            return handleError(res, error);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;

            const deletedDocument = await this.service.delete(parseInt(id));

            if (!deletedDocument) {
                return handleError(res, new Error('Documento não encontrado'), 404);
            }

            return handleResponse(res, deletedDocument);
        } catch (error) {
            logger.error('Erro ao excluir documento', { error, id: req.params.id });
            return handleError(res, error);
        }
    }
}

module.exports = PersonDocumentController;
