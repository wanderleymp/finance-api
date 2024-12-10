"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserLicenseRepository = void 0;
const client_1 = require("@prisma/client");
class UserLicenseRepository {
    prisma;
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async create(data) {
        return this.prisma.userLicense.create({ data });
    }
    async findById(id) {
        return this.prisma.userLicense.findUnique({
            where: { id },
            include: {
                user: true,
                license: true
            }
        });
    }
    async findAll(params) {
        const { skip, take, cursor, where, orderBy } = params || {};
        return this.prisma.userLicense.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
            include: {
                user: true,
                license: true
            }
        });
    }
    async update(id, data) {
        return this.prisma.userLicense.update({
            where: { id },
            data
        });
    }
    async delete(id) {
        return this.prisma.userLicense.delete({
            where: { id }
        });
    }
    async findByUserAndLicense(userId, licenseId) {
        return this.prisma.userLicense.findUnique({
            where: {
                userId_licenseId: {
                    userId,
                    licenseId
                }
            }
        });
    }
}
exports.UserLicenseRepository = UserLicenseRepository;
//# sourceMappingURL=userLicenseRepository.js.map