"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonContactRepository = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class PersonContactRepository {
    prismaClient;
    constructor() {
        this.prismaClient = prisma_1.default;
    }
    async create(data) {
        return this.prismaClient.personContact.create({ data });
    }
    async findById(id) {
        return this.prismaClient.personContact.findUnique({
            where: { id },
            include: {
                person: true,
                contact: true
            }
        });
    }
    async findByPersonAndContact(person, contactId) {
        return this.prismaClient.personContact.findFirst({
            where: {
                person,
                contactId
            }
        });
    }
    async update(id, data) {
        return this.prismaClient.personContact.update({
            where: { id },
            data
        });
    }
    async delete(id) {
        return this.prismaClient.personContact.delete({
            where: { id }
        });
    }
    async findAll(params) {
        return this.prismaClient.personContact.findMany({
            ...params,
            include: {
                person: true,
                contact: true
            }
        });
    }
    async count(where) {
        return this.prismaClient.personContact.count({ where });
    }
}
exports.PersonContactRepository = PersonContactRepository;
//# sourceMappingURL=personContactRepository.js.map