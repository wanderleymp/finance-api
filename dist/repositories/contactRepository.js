"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactRepository = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class ContactRepository {
    prismaClient;
    constructor() {
        this.prismaClient = prisma_1.default;
    }
    async create(data) {
        return this.prismaClient.contact.create({
            data,
            include: {
                personContacts: {
                    include: { person: true }
                }
            }
        });
    }
    async findById(id) {
        return this.prismaClient.contact.findUnique({
            where: { id },
            include: {
                personContacts: {
                    include: { person: true }
                }
            }
        });
    }
    async findByTypeAndValue(type, value) {
        return this.prismaClient.contact.findFirst({
            where: {
                type,
                value
            }
        });
    }
    async findAll(params) {
        return this.prismaClient.contact.findMany({
            ...params,
            include: {
                personContacts: {
                    include: { person: true }
                }
            }
        });
    }
    async update(id, data) {
        return this.prismaClient.contact.update({
            where: { id },
            data,
            include: {
                personContacts: {
                    include: { person: true }
                }
            }
        });
    }
    async delete(id) {
        return this.prismaClient.contact.delete({
            where: { id }
        });
    }
    async count(where) {
        return this.prismaClient.contact.count({ where });
    }
}
exports.ContactRepository = ContactRepository;
//# sourceMappingURL=contactRepository.js.map