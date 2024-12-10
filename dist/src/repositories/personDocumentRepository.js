"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonDocumentRepository = void 0;
const client_1 = require("@prisma/client");
class PersonDocumentRepository {
    prisma;
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async create(data) {
        return this.prisma.personDocument.create({
            data,
            include: {
                person: true
            }
        });
    }
    async findById(id) {
        return this.prisma.personDocument.findUnique({
            where: { id },
            include: {
                person: true
            }
        });
    }
    async findAll(params) {
        const { skip, take, cursor, where, orderBy } = params;
        return this.prisma.personDocument.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
            include: {
                person: true
            }
        });
    }
    async update(id, data) {
        return this.prisma.personDocument.update({
            where: { id },
            data,
            include: {
                person: true
            }
        });
    }
    async delete(id) {
        return this.prisma.personDocument.delete({
            where: { id }
        });
    }
    async count(where) {
        return this.prisma.personDocument.count({ where });
    }
    async findByPersonAndType(person, type) {
        return this.prisma.personDocument.findUnique({
            where: {
                person_type_number: {
                    person,
                    type: type,
                    number: '' // Placeholder, será substituído na implementação
                }
            }
        });
    }
}
exports.PersonDocumentRepository = PersonDocumentRepository;
//# sourceMappingURL=personDocumentRepository.js.map