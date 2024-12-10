"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseRepository = void 0;
const client_1 = require("@prisma/client");
class LicenseRepository {
    prisma;
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async create(data) {
        return this.prisma.license.create({ data });
    }
    async findById(id) {
        return this.prisma.license.findUnique({
            where: { id },
            include: {
                owner: true,
                persons: true,
                users: true
            }
        });
    }
    async findAll(params) {
        const { skip, take, cursor, where, orderBy } = params || {};
        return this.prisma.license.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
            include: {
                owner: true,
                persons: true,
                users: true
            }
        });
    }
    async update(id, data) {
        return this.prisma.license.update({
            where: { id },
            data
        });
    }
    async delete(id) {
        return this.prisma.license.delete({
            where: { id }
        });
    }
}
exports.LicenseRepository = LicenseRepository;
//# sourceMappingURL=licenseRepository.js.map