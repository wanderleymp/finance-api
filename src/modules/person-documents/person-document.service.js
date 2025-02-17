const PersonDocumentRepository = require('./person-document.repository');
const PersonRepository = require('../persons/person.repository');
const { validateDocument } = require('../../utils/documentValidator');
const { ValidationError } = require('../../utils/errors');
const { logger } = require('../../middlewares/logger');

class PersonDocumentService {
    constructor(
        documentRepo = new PersonDocumentRepository(),
        personRepo = new PersonRepository()
    ) {
        this.documentRepo = documentRepo;
        this.personRepo = personRepo;
    }

    async findAll(page, limit, filters = {}) {
        try {
            return await this.documentRepo.findAll(page, limit, filters);
        } catch (error) {
            logger.error('Erro ao listar documentos', { error, page, limit, filters });
            throw error;
        }
    }

    async findById(id) {
        try {
            const document = await this.documentRepo.findById(id);
            if (!document) {
                throw new ValidationError('Documento não encontrado', 404);
            }

            return document;
        } catch (error) {
            logger.error('Erro ao buscar documento por ID', { error, id });
            throw error;
        }
    }

    async findByPersonId(personId, page, limit) {
        try {
            const person = await this.personRepo.findById(personId);
            if (!person) {
                throw new ValidationError('Pessoa não encontrada', 404);
            }

            return await this.documentRepo.findByPersonId(personId, page, limit);
        } catch (error) {
            logger.error('Erro ao buscar documentos por pessoa', { error, personId, page, limit });
            throw error;
        }
    }

    async findByDocumentValue(type, value) {
        try {
            logger.info('Service: Buscando documento por valor', { type, value });
            const documents = await this.findAll(1, 1, {
                document_type: type,
                document_value: value
            });

            if (!documents?.data?.length) {
                logger.info('Service: Documento não encontrado', { type, value });
                return null;
            }

            logger.info('Service: Documento encontrado', { document: documents.data[0] });
            return documents.data[0];
        } catch (error) {
            logger.error('Erro ao buscar documento por valor', { error, type, value });
            throw error;
        }
    }

    async create(personId, documentData) {
        try {
            logger.info('Service: Iniciando criação de documento', { personId, documentData });
            
            if (!personId) {
                throw new ValidationError('ID da pessoa é obrigatório');
            }

            const person = await this.personRepo.findById(personId);
            if (!person) {
                throw new ValidationError('Pessoa não encontrada', 404);
            }
            logger.info('Service: Pessoa encontrada', { person });

            // Se recebeu o personId junto com documentData, remove
            if (documentData.person_id) {
                delete documentData.person_id;
            }

            // Valida o número do documento
            logger.info('Service: Validando documento', { type: documentData.document_type, value: documentData.document_value });
            try {
                validateDocument(documentData.document_type, documentData.document_value);
                logger.info('Service: Documento validado com sucesso');
            } catch (validationError) {
                logger.warn('Service: Erro na validação do documento', { error: validationError.message });
                // Para CNPJ, vamos prosseguir mesmo com erro de validação
                if (documentData.document_type !== 'CNPJ') {
                    throw validationError;
                }
            }

            // Verifica se já existe um documento com o mesmo valor
            const existingDocumentByValue = await this.findByDocumentValue(
                documentData.document_type,
                documentData.document_value
            );
            logger.info('Service: Verificação de documento existente por valor', { 
                existingDocumentByValue,
                type: documentData.document_type,
                value: documentData.document_value
            });

            // Se já existe um documento com o mesmo valor para outra pessoa, retorna erro
            if (existingDocumentByValue && existingDocumentByValue.person_id !== personId) {
                throw new ValidationError('Este documento já está cadastrado para outra pessoa');
            }

            // Se já existe um documento com o mesmo valor para a mesma pessoa, retorna ele
            if (existingDocumentByValue && existingDocumentByValue.person_id === personId) {
                logger.info('Service: Documento já existe para esta pessoa', {
                    documentId: existingDocumentByValue.id,
                    personId,
                    type: documentData.document_type,
                    value: documentData.document_value
                });
                return existingDocumentByValue;
            }

            // Verifica se já existe um documento do mesmo tipo para a pessoa
            const existingDocument = await this.documentRepo.findByTypeAndPerson(
                documentData.document_type,
                personId
            );
            logger.info('Service: Verificação de documento existente por tipo', { 
                existingDocument,
                type: documentData.document_type,
                personId
            });

            // Se já existe um documento do mesmo tipo, atualiza o valor
            if (existingDocument) {
                logger.info('Service: Atualizando valor do documento existente', {
                    documentId: existingDocument.person_document_id,
                    oldValue: existingDocument.document_value,
                    newValue: documentData.document_value
                });
                
                return await this.documentRepo.update(existingDocument.person_document_id, {
                    document_value: documentData.document_value
                });
            }

            const newDocument = await this.documentRepo.create({
                ...documentData,
                person_id: personId
            });
            logger.info('Service: Documento criado com sucesso', { 
                newDocument,
                personId,
                type: documentData.document_type,
                value: documentData.document_value
            });

            return newDocument;
        } catch (error) {
            logger.error('Erro ao criar documento', { error, personId, documentData });
            throw error;
        }
    }

    async update(id, documentData) {
        try {
            const document = await this.documentRepo.findById(id);
            if (!document) {
                throw new ValidationError('Documento não encontrado', 404);
            }

            // Se o tipo do documento foi alterado, valida se já existe outro do mesmo tipo
            if (documentData.document_type && documentData.document_type !== document.document_type) {
                const existingDocument = await this.documentRepo.findByTypeAndPerson(
                    documentData.document_type,
                    document.person_id
                );

                if (existingDocument && existingDocument.id !== id) {
                    throw new ValidationError('Já existe um documento deste tipo para esta pessoa');
                }
            }

            // Se o número do documento foi alterado, valida o novo número
            if (documentData.document_value) {
                const type = documentData.document_type || document.document_type;
                if (!validateDocument(type, documentData.document_value)) {
                    throw new ValidationError('Número de documento inválido');
                }
            }

            const updatedDocument = await this.documentRepo.update(id, documentData);

            return updatedDocument;
        } catch (error) {
            logger.error('Erro ao atualizar documento', { error, id, documentData });
            throw error;
        }
    }

    async delete(id) {
        try {
            const document = await this.documentRepo.findById(id);
            if (!document) {
                throw new ValidationError('Documento não encontrado', 404);
            }

            await this.documentRepo.delete(id);

            return document;
        } catch (error) {
            logger.error('Erro ao excluir documento', { error, id });
            throw error;
        }
    }
}

module.exports = PersonDocumentService;
