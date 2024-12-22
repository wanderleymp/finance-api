const PersonDocumentRepository = require('./person-document.repository');
const PersonRepository = require('../persons/person.repository');
const { validateDocument } = require('../../utils/documentValidator');
const { ValidationError } = require('../../utils/errors');
const { logger } = require('../../middlewares/logger');
const { redisClient } = require('../../config/redis');

class PersonDocumentService {
    constructor(
        documentRepo = new PersonDocumentRepository(),
        personRepo = new PersonRepository()
    ) {
        this.documentRepo = documentRepo;
        this.personRepo = personRepo;
        this.cachePrefix = 'person_document:';
        this.cacheTTL = 3600; // 1 hora
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
            const cacheKey = `${this.cachePrefix}${id}`;
            const cachedDocument = await redisClient.get(cacheKey);
            
            if (cachedDocument) {
                return JSON.parse(cachedDocument);
            }

            const document = await this.documentRepo.findById(id);
            if (!document) {
                throw new ValidationError('Documento não encontrado', 404);
            }

            await redisClient.setex(cacheKey, this.cacheTTL, JSON.stringify(document));
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

    async create(personId, documentData) {
        try {
            const person = await this.personRepo.findById(personId);
            if (!person) {
                throw new ValidationError('Pessoa não encontrada', 404);
            }

            // Valida o número do documento
            if (!validateDocument(documentData.number, documentData.type)) {
                throw new ValidationError('Número de documento inválido');
            }

            // Verifica se já existe um documento do mesmo tipo para a pessoa
            const existingDocument = await this.documentRepo.findByTypeAndPerson(
                documentData.type,
                personId
            );

            if (existingDocument) {
                throw new ValidationError('Já existe um documento deste tipo para esta pessoa');
            }

            const newDocument = await this.documentRepo.create({
                ...documentData,
                person_id: personId
            });

            // Invalida o cache de listagem
            await this.invalidateListCache(personId);

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
            if (documentData.type && documentData.type !== document.type) {
                const existingDocument = await this.documentRepo.findByTypeAndPerson(
                    documentData.type,
                    document.person_id
                );

                if (existingDocument && existingDocument.id !== id) {
                    throw new ValidationError('Já existe um documento deste tipo para esta pessoa');
                }
            }

            // Se o número do documento foi alterado, valida o novo número
            if (documentData.number) {
                const type = documentData.type || document.type;
                if (!validateDocument(documentData.number, type)) {
                    throw new ValidationError('Número de documento inválido');
                }
            }

            const updatedDocument = await this.documentRepo.update(id, documentData);

            // Invalida os caches
            await this.invalidateCache(id);
            await this.invalidateListCache(document.person_id);

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

            // Invalida os caches
            await this.invalidateCache(id);
            await this.invalidateListCache(document.person_id);

            return document;
        } catch (error) {
            logger.error('Erro ao excluir documento', { error, id });
            throw error;
        }
    }

    async invalidateCache(id) {
        try {
            await redisClient.del(`${this.cachePrefix}${id}`);
        } catch (error) {
            logger.error('Erro ao invalidar cache do documento', { error, id });
        }
    }

    async invalidateListCache(personId) {
        try {
            const pattern = `${this.cachePrefix}list:${personId}:*`;
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        } catch (error) {
            logger.error('Erro ao invalidar cache de listagem', { error, personId });
        }
    }
}

module.exports = PersonDocumentService;
