"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonLicenseService = void 0;
const personLicenseRepository_1 = require("../repositories/personLicenseRepository");
const personRepository_1 = require("../repositories/personRepository");
const licenseRepository_1 = require("../repositories/licenseRepository");
const badRequestError_1 = require("../errors/badRequestError");
class PersonLicenseService {
    personLicenseRepository;
    personRepository;
    licenseRepository;
    constructor() {
        this.personLicenseRepository = new personLicenseRepository_1.PersonLicenseRepository();
        this.personRepository = new personRepository_1.PersonRepository();
        this.licenseRepository = new licenseRepository_1.LicenseRepository();
    }
    async assignLicenseToPerson(data) {
        // Validar se a pessoa existe
        const person = await this.personRepository.findById(data.personId);
        if (!person) {
            throw new badRequestError_1.BadRequestError('Pessoa não encontrada');
        }
        // Validar se a licença existe
        const license = await this.licenseRepository.findById(data.licenseId);
        if (!license) {
            throw new badRequestError_1.BadRequestError('Licença não encontrada');
        }
        // Verificar se já existe essa associação
        const existingAssociation = await this.personLicenseRepository.findByPersonAndLicense(data.personId, data.licenseId);
        if (existingAssociation) {
            throw new badRequestError_1.BadRequestError('Pessoa já possui esta licença');
        }
        return this.personLicenseRepository.create(data);
    }
    async getPersonLicenseById(id) {
        const personLicense = await this.personLicenseRepository.findById(id);
        if (!personLicense) {
            throw new badRequestError_1.BadRequestError('Associação de pessoa e licença não encontrada');
        }
        return personLicense;
    }
    async getAllPersonLicenses(params) {
        return this.personLicenseRepository.findAll(params);
    }
    async updatePersonLicense(id, data) {
        // Verificar se a associação existe
        await this.getPersonLicenseById(id);
        // Validações adicionais podem ser adicionadas aqui
        if (data.personId) {
            const person = await this.personRepository.findById(data.personId);
            if (!person) {
                throw new badRequestError_1.BadRequestError('Pessoa não encontrada');
            }
        }
        if (data.licenseId) {
            const license = await this.licenseRepository.findById(data.licenseId);
            if (!license) {
                throw new badRequestError_1.BadRequestError('Licença não encontrada');
            }
        }
        return this.personLicenseRepository.update(id, data);
    }
    async removePersonLicense(id) {
        // Verificar se a associação existe
        await this.getPersonLicenseById(id);
        return this.personLicenseRepository.delete(id);
    }
}
exports.PersonLicenseService = PersonLicenseService;
//# sourceMappingURL=personLicenseService.js.map