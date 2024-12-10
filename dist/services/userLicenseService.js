"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserLicenseService = void 0;
const userLicenseRepository_1 = require("../repositories/userLicenseRepository");
const userRepository_1 = require("../repositories/userRepository");
const licenseRepository_1 = require("../repositories/licenseRepository");
const badRequestError_1 = require("../errors/badRequestError");
class UserLicenseService {
    userLicenseRepository;
    userRepository;
    licenseRepository;
    constructor() {
        this.userLicenseRepository = new userLicenseRepository_1.UserLicenseRepository();
        this.userRepository = new userRepository_1.UserRepository();
        this.licenseRepository = new licenseRepository_1.LicenseRepository();
    }
    async assignLicenseToUser(data) {
        // Validar se o usuário existe
        const user = await this.userRepository.findById(data.userId);
        if (!user) {
            throw new badRequestError_1.BadRequestError('Usuário não encontrado');
        }
        // Validar se a licença existe
        const license = await this.licenseRepository.findById(data.licenseId);
        if (!license) {
            throw new badRequestError_1.BadRequestError('Licença não encontrada');
        }
        // Verificar se já existe essa associação
        const existingAssociation = await this.userLicenseRepository.findByUserAndLicense(data.userId, data.licenseId);
        if (existingAssociation) {
            throw new badRequestError_1.BadRequestError('Usuário já possui esta licença');
        }
        return this.userLicenseRepository.create(data);
    }
    async getUserLicenseById(id) {
        const userLicense = await this.userLicenseRepository.findById(id);
        if (!userLicense) {
            throw new badRequestError_1.BadRequestError('Associação de usuário e licença não encontrada');
        }
        return userLicense;
    }
    async getAllUserLicenses(params) {
        return this.userLicenseRepository.findAll(params);
    }
    async updateUserLicense(id, data) {
        // Verificar se a associação existe
        await this.getUserLicenseById(id);
        // Validações adicionais podem ser adicionadas aqui
        if (data.userId) {
            const user = await this.userRepository.findById(data.userId);
            if (!user) {
                throw new badRequestError_1.BadRequestError('Usuário não encontrado');
            }
        }
        if (data.licenseId) {
            const license = await this.licenseRepository.findById(data.licenseId);
            if (!license) {
                throw new badRequestError_1.BadRequestError('Licença não encontrada');
            }
        }
        return this.userLicenseRepository.update(id, data);
    }
    async removeUserLicense(id) {
        // Verificar se a associação existe
        await this.getUserLicenseById(id);
        return this.userLicenseRepository.delete(id);
    }
}
exports.UserLicenseService = UserLicenseService;
//# sourceMappingURL=userLicenseService.js.map