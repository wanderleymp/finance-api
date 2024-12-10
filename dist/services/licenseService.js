"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseService = void 0;
const licenseRepository_1 = require("../repositories/licenseRepository");
const personRepository_1 = require("../repositories/personRepository");
const badRequestError_1 = require("../errors/badRequestError");
class LicenseService {
    licenseRepository;
    personRepository;
    constructor() {
        this.licenseRepository = new licenseRepository_1.LicenseRepository();
        this.personRepository = new personRepository_1.PersonRepository();
    }
    async createLicense(data) {
        // Validar se o proprietário da licença existe
        const owner = await this.personRepository.findById(data.personId);
        if (!owner) {
            throw new badRequestError_1.BadRequestError('Pessoa proprietária da licença não encontrada');
        }
        // Validações adicionais podem ser adicionadas aqui
        if (!data.name || data.name.trim() === '') {
            throw new badRequestError_1.BadRequestError('Nome da licença é obrigatório');
        }
        return this.licenseRepository.create(data);
    }
    async getLicenseById(id) {
        const license = await this.licenseRepository.findById(id);
        if (!license) {
            throw new badRequestError_1.BadRequestError('Licença não encontrada');
        }
        return license;
    }
    async getAllLicenses(params) {
        return this.licenseRepository.findAll(params);
    }
    async updateLicense(id, data) {
        // Verificar se a licença existe
        await this.getLicenseById(id);
        // Validações adicionais podem ser adicionadas aqui
        if (data.personId) {
            const owner = await this.personRepository.findById(data.personId);
            if (!owner) {
                throw new badRequestError_1.BadRequestError('Pessoa proprietária da licença não encontrada');
            }
        }
        return this.licenseRepository.update(id, data);
    }
    async deleteLicense(id) {
        // Verificar se a licença existe
        await this.getLicenseById(id);
        return this.licenseRepository.delete(id);
    }
}
exports.LicenseService = LicenseService;
//# sourceMappingURL=licenseService.js.map