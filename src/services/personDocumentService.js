const personDocumentRepository = require('../repositories/personDocumentRepository');
const personRepository = require('../repositories/personRepository');
const { ValidationError } = require('../utils/errors');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');

class PersonDocumentService {
    async listDocuments(page, limit, filters = {}) {
        try {
            const { page: validPage, limit: validLimit } = PaginationHelper.validateParams(page, limit);
            const result = await personDocumentRepository.findAll(filters, validPage, validLimit);
            
            return PaginationHelper.formatResponse(
                result.data,
                result.total,
                validPage,
                validLimit
            );
        } catch (error) {
            logger.error('Erro ao listar documentos', {
                error: error.message,
                page,
                limit,
                filters
            });
            throw error;
        }
    }

    async getDocument(documentId) {
        const document = await personDocumentRepository.findById(documentId);
        if (!document) {
            throw new ValidationError('Documento não encontrado', 404);
        }
        return document;
    }

    async createDocument(documentData) {
        try {
            // Verifica se a pessoa existe
            const person = await personRepository.findById(documentData.person_id);
            if (!person) {
                throw new ValidationError('Pessoa não encontrada', 404);
            }

            // Verifica se já existe um documento do mesmo tipo para a pessoa
            const existingDocs = await personDocumentRepository.findByPersonId(documentData.person_id);
            const duplicateDoc = existingDocs.find(doc => 
                doc.document_type === documentData.document_type
            );

            if (duplicateDoc) {
                throw new ValidationError(
                    `Já existe um documento do tipo ${documentData.document_type} para esta pessoa`,
                    400
                );
            }

            return await personDocumentRepository.create(documentData);
        } catch (error) {
            logger.error('Erro ao criar documento', {
                error: error.message,
                documentData
            });
            throw error;
        }
    }

    async updateDocument(documentId, documentData) {
        try {
            // Verifica se o documento existe
            const document = await this.getDocument(documentId);

            // Se estiver alterando o tipo do documento, verifica duplicidade
            if (documentData.document_type && documentData.document_type !== document.document_type) {
                const existingDocs = await personDocumentRepository.findByPersonId(document.person_id);
                const duplicateDoc = existingDocs.find(doc => 
                    doc.document_type === documentData.document_type &&
                    doc.person_document_id !== documentId
                );

                if (duplicateDoc) {
                    throw new ValidationError(
                        `Já existe um documento do tipo ${documentData.document_type} para esta pessoa`,
                        400
                    );
                }
            }

            const updatedDocument = await personDocumentRepository.update(documentId, documentData);
            if (!updatedDocument) {
                throw new ValidationError('Documento não encontrado', 404);
            }

            return updatedDocument;
        } catch (error) {
            logger.error('Erro ao atualizar documento', {
                error: error.message,
                documentId,
                documentData
            });
            throw error;
        }
    }

    async deleteDocument(documentId) {
        try {
            const document = await this.getDocument(documentId);
            await personDocumentRepository.delete(documentId);
        } catch (error) {
            logger.error('Erro ao deletar documento', {
                error: error.message,
                documentId
            });
            throw error;
        }
    }

    async getPersonDocuments(personId) {
        try {
            // Verifica se a pessoa existe
            const person = await personRepository.findById(personId);
            if (!person) {
                throw new ValidationError('Pessoa não encontrada', 404);
            }

            return await personDocumentRepository.findByPersonId(personId);
        } catch (error) {
            logger.error('Erro ao buscar documentos da pessoa', {
                error: error.message,
                personId
            });
            throw error;
        }
    }
}

module.exports = new PersonDocumentService();
