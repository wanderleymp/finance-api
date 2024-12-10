"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonRepository = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class PersonRepository {
    prismaClient;
    constructor() {
        this.prismaClient = prisma_1.default;
    }
    async create(data) {
        return this.prismaClient.person.create({
            data,
            include: {
                contacts: true,
                addresses: true,
                documents: true
            }
        });
    }
    async findById(id) {
        return this.prismaClient.person.findUnique({
            where: { id },
            include: {
                contacts: true,
                addresses: true,
                documents: true
            }
        });
    }
    async findAll(params) {
        return this.prismaClient.person.findMany({
            ...params,
            include: {
                contacts: true,
                addresses: true,
                documents: true
            }
        });
    }
    async update(id, data) {
        return this.prismaClient.person.update({
            where: { id },
            data,
            include: {
                contacts: true,
                addresses: true,
                documents: true
            }
        });
    }
    async delete(id) {
        return this.prismaClient.person.delete({
            where: { id }
        });
    }
    async count(where) {
        return this.prismaClient.person.count({ where });
    }
    async findByDocument(documentNumber) {
        return this.prismaClient.person.findFirst({
            where: {
                documents: {
                    some: {
                        number: documentNumber
                    }
                }
            },
            include: {
                contacts: true,
                addresses: true,
                documents: true
            }
        });
    }
}
exports.PersonRepository = PersonRepository;
//# sourceMappingURL=personRepository.js.map