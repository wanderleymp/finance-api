"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonAddressRepository = void 0;
const client_1 = require("@prisma/client");
class PersonAddressRepository {
    prisma;
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async create(data) {
        return this.prisma.personAddress.create({
            data,
            include: {
                person: true
            }
        });
    }
    async findById(id) {
        return this.prisma.personAddress.findUnique({
            where: { id },
            include: {
                person: true
            }
        });
    }
    async findAll(params) {
        const { skip, take, cursor, where, orderBy } = params;
        return this.prisma.personAddress.findMany({
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
        return this.prisma.personAddress.update({
            where: { id },
            data,
            include: {
                person: true
            }
        });
    }
    async delete(id) {
        return this.prisma.personAddress.delete({
            where: { id }
        });
    }
    async count(where) {
        return this.prisma.personAddress.count({ where });
    }
    async findMainAddressByPersonId(personId) {
        return this.prisma.personAddress.findFirst({
            where: {
                personId,
                isMain: true
            }
        });
    }
}
exports.PersonAddressRepository = PersonAddressRepository;
//# sourceMappingURL=personAddressRepository.js.map