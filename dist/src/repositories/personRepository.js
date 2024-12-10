"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonRepository = void 0;
const typeorm_1 = require("typeorm");
const Persons_1 = require("../entities/Persons");
const typeorm_2 = require("../config/typeorm");
class PersonRepository {
    repository;
    constructor() {
        this.repository = typeorm_2.AppDataSource.getRepository(Persons_1.Persons);
    }
    async create(data) {
        const person = this.repository.create(data);
        return this.repository.save(person);
    }
    async findById(id) {
        return this.repository.findOne({
            where: { person_id: id }
        });
    }
    async findAll(options = {}) {
        return this.repository.find({
            skip: options.skip || 0,
            take: options.take || 10,
            order: options.order || { created_at: 'DESC' },
            where: options.where
        });
    }
    async update(id, data) {
        await this.repository.update(id, data);
        return this.findById(id);
    }
    async delete(id) {
        const result = await this.repository.delete(id);
        return result.affected !== 0;
    }
    async count(where) {
        return this.repository.count({ where });
    }
    async findByDocument(documentNumber) {
        return this.repository.findOne({
            where: {
                documents: {
                    some: {
                        number: documentNumber
                    }
                }
            }
        });
    }
    async findByContact(contact) {
        return this.repository.createQueryBuilder('person')
            .innerJoin('person.contacts', 'contact')
            .where('contact.value = :contact', { contact })
            .getOne();
    }
    async findByCnpj(cnpj) {
        return this.repository.createQueryBuilder('person')
            .innerJoin('person.documents', 'document')
            .where('document.number = :cnpj AND document.type = "CNPJ"', { cnpj })
            .getOne();
    }
    async saveOrUpdateByCnpj(cnpj, personData) {
        const existingPerson = await this.findByCnpj(cnpj);
        if (existingPerson) {
            return this.update(existingPerson.person_id, personData);
        }
        else {
            return this.create({
                ...personData,
            });
        }
    }
    async findByName(name, options = {}) {
        const { exact = false, limit = 10 } = options;
        const whereCondition = exact
            ? { full_name: name }
            : { full_name: (0, typeorm_1.Like)(`%${name}%`) };
        return this.repository.find({
            where: whereCondition,
            take: limit
        });
    }
}
exports.PersonRepository = PersonRepository;
//# sourceMappingURL=personRepository.js.map