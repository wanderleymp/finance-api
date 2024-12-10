"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonDocumentService = void 0;
const personDocumentRepository_1 = require("../repositories/personDocumentRepository");
const personRepository_1 = require("../repositories/personRepository");
const apiErrors_1 = require("../utils/apiErrors");
const documentValidation_1 = require("../utils/documentValidation");
class PersonDocumentService {
    personDocumentRepository;
    personRepository;
    constructor() {
        this.personDocumentRepository = new personDocumentRepository_1.PersonDocumentRepository();
        this.personRepository = new personRepository_1.PersonRepository();
    }
    async createPersonDocument(personDocumentData) {
        // Validações básicas
        if (!personDocumentData.person) {
            throw new apiErrors_1.BadRequestError('Pessoa é obrigatória');
        }
        if (!personDocumentData.type || !personDocumentData.number) {
            throw new apiErrors_1.BadRequestError('Tipo e número do documento são obrigatórios');
        }
        // Verificar se a pessoa existe
        await this.personRepository.findById(personDocumentData.person.connect?.id || '');
        // Validação específica por tipo de documento
        switch (personDocumentData.type) {
            case 'CPF':
                if (!(0, documentValidation_1.validateCPF)(personDocumentData.number)) {
                    throw new apiErrors_1.BadRequestError('CPF inválido');
                }
                break;
            case 'CNPJ':
                if (!(0, documentValidation_1.validateCNPJ)(personDocumentData.number)) {
                    throw new apiErrors_1.BadRequestError('CNPJ inválido');
                }
                break;
        }
        // Verificar se já existe um documento deste tipo para esta pessoa
        const existingDocument = await this.personDocumentRepository.findByPersonAndType(personDocumentData.person.connect?.id || '', personDocumentData.type);
        if (existingDocument) {
            throw new apiErrors_1.ConflictError(`Documento do tipo ${personDocumentData.type} já existe para esta pessoa`);
        }
        return this.personDocumentRepository.create(personDocumentData);
    }
    async getPersonDocumentById(id) {
        const personDocument = await this.personDocumentRepository.findById(id);
        if (!personDocument) {
            throw new apiErrors_1.NotFoundError('Documento não encontrado');
        }
        return personDocument;
    }
    async listPersonDocuments(params) {
        const { page = 1, limit = 10, person, type } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (person)
            where.person = person;
        if (type)
            where.type = type;
        const [personDocuments, total] = await Promise.all([
            this.personDocumentRepository.findAll({
                skip,
                take: limit,
                where,
                orderBy: { createdAt: 'desc' }
            }),
            this.personDocumentRepository.count(where)
        ]);
        return {
            personDocuments,
            total,
            page,
            limit
        };
    }
    async updatePersonDocument(id, personDocumentData) {
        // Verificar se o documento existe
        const existingDocument = await this.getPersonDocumentById(id);
        // Validação de número de documento, se for atualizado
        if (personDocumentData.number) {
            switch (existingDocument.type) {
                case 'CPF':
                    if (!(0, documentValidation_1.validateCPF)(personDocumentData.number)) {
                        throw new apiErrors_1.BadRequestError('CPF inválido');
                    }
                    break;
                case 'CNPJ':
                    if (!(0, documentValidation_1.validateCNPJ)(personDocumentData.number)) {
                        throw new apiErrors_1.BadRequestError('CNPJ inválido');
                    }
                    break;
            }
        }
        return this.personDocumentRepository.update(id, personDocumentData);
    }
    async deletePersonDocument(id) {
        // Verificar se o documento existe
        await this.getPersonDocumentById(id);
        return this.personDocumentRepository.delete(id);
    }
}
exports.PersonDocumentService = PersonDocumentService;
//# sourceMappingURL=personDocumentService.js.map