"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonService = void 0;
const personRepository_1 = require("../repositories/personRepository");
const apiErrors_1 = require("../utils/apiErrors");
class PersonService {
    personRepository;
    constructor() {
        this.personRepository = new personRepository_1.PersonRepository();
    }
    async createPerson(data) {
        // Validações básicas
        if (!data.full_name) {
            throw new apiErrors_1.ApiError('Nome completo é obrigatório', 400);
        }
        // Verificar se já existe uma pessoa com o mesmo documento
        if (data.documents && data.documents.create) {
            const existingPerson = await this.personRepository.findByDocument(data.documents.create[0].number);
            if (existingPerson) {
                throw new apiErrors_1.ApiError('Já existe uma pessoa com este documento', 409);
            }
        }
        return this.personRepository.create(data);
    }
    async getPersonById(id) {
        const person = await this.personRepository.findById(id);
        if (!person) {
            throw new apiErrors_1.ApiError('Pessoa não encontrada', 404);
        }
        return person;
    }
    async updatePerson(id, personData) {
        // Verificar se a pessoa existe
        await this.getPersonById(id);
        // Verificar se está tentando atualizar documento
        if (personData.documents) {
            throw new apiErrors_1.ApiError('Não é possível atualizar documentos diretamente', 400);
        }
        return this.personRepository.update(id, personData);
    }
    async deletePerson(id) {
        // Verificar se a pessoa existe
        await this.getPersonById(id);
        return this.personRepository.delete(id);
    }
    async findPersons(params) {
        const processedParams = {
            ...params,
            where: {
                ...params?.where,
                full_name: params?.where?.full_name
                    ? { contains: params.where.full_name, mode: 'insensitive' }
                    : undefined
            }
        };
        return this.personRepository.findAll(processedParams);
    }
    async countPersons(where) {
        return this.personRepository.count(where);
    }
    async listPersons(params) {
        const { page = 1, limit = 10, name } = params;
        const skip = (page - 1) * limit;
        const where = name
            ? { name: { contains: name, mode: 'insensitive' } }
            : {};
        const [persons, total] = await Promise.all([
            this.personRepository.findAll({
                skip,
                take: limit,
                where,
                orderBy: { createdAt: 'desc' }
            }),
            this.personRepository.count(where)
        ]);
        return {
            persons,
            total,
            page,
            limit
        };
    }
}
exports.PersonService = PersonService;
//# sourceMappingURL=personService.js.map