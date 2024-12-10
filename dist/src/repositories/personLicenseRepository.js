"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonLicenseRepository = void 0;
const client_1 = require("@prisma/client");
class PersonLicenseRepository {
    prisma;
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async create(data) {
        return this.prisma.personLicense.create({ data });
    }
    async findById(id) {
        return this.prisma.personLicense.findUnique({
            where: { id },
            include: {
                person: true,
                license: true
            }
        });
    }
    async findAll(params) {
        const { skip, take, cursor, where, orderBy } = params || {};
        return this.prisma.personLicense.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
            include: {
                person: true,
                license: true
            }
        });
    }
    async update(id, data) {
        return this.prisma.personLicense.update({
            where: { id },
            data
        });
    }
    async delete(id) {
        return this.prisma.personLicense.delete({
            where: { id }
        });
    }
    async findByPersonAndLicense(person, license) {
        return this.prisma.personLicense.findUnique({
            where: {
                person_license: {
                    person,
                    license
                }
            }
        });
    }
}
exports.PersonLicenseRepository = PersonLicenseRepository;
//# sourceMappingURL=personLicenseRepository.js.map