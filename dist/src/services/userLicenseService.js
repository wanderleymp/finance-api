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
        const user = await this.userRepository.findById(data.user);
        if (!user) {
            throw new badRequestError_1.BadRequestError("Usu\u00E1rio n\u00E3o encontrado");
        }
        // Validar se a licença existe
        const license = await this.licenseRepository.findById(data.license);
        if (!license) {
            throw new badRequestError_1.BadRequestError("Licen\u00E7a n\u00E3o encontrada");
        }
        // Verificar se já existe essa associação
        const existingAssociation = await this.userLicenseRepository.findByUserAndLicense(data.user, data.license);
        if (existingAssociation) {
            throw new badRequestError_1.BadRequestError("Usu\u00E1rio j\u00E1 possui esta licen\u00E7a");
        }
        return this.userLicenseRepository.create(data);
    }
    async getUserLicenseById(id) {
        const userLicense = await this.userLicenseRepository.findById(id);
        if (!userLicense) {
            throw new badRequestError_1.BadRequestError("Associa\u00E7\u00E3o de usu\u00E1rio e licen\u00E7a n\u00E3o encontrada");
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
        if (data.user) {
            const user = await this.userRepository.findById(data.user);
            if (!user) {
                throw new badRequestError_1.BadRequestError("Usu\u00E1rio n\u00E3o encontrado");
            }
        }
        if (data.license) {
            const license = await this.licenseRepository.findById(data.license);
            if (!license) {
                throw new badRequestError_1.BadRequestError("Licen\u00E7a n\u00E3o encontrada");
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