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
        const person = await this.personRepository.findById(data.person);
        if (!person) {
            throw new badRequestError_1.BadRequestError("Pessoa n\u00E3o encontrada");
        }
        // Validar se a licença existe
        const license = await this.licenseRepository.findById(data.license);
        if (!license) {
            throw new badRequestError_1.BadRequestError("Licen\u00E7a n\u00E3o encontrada");
        }
        // Verificar se já existe essa associação
        const existingAssociation = await this.personLicenseRepository.findByPersonAndLicense(data.person, data.license);
        if (existingAssociation) {
            throw new badRequestError_1.BadRequestError("Pessoa j\u00E1 possui esta licen\u00E7a");
        }
        return this.personLicenseRepository.create(data);
    }
    async getPersonLicenseById(id) {
        const personLicense = await this.personLicenseRepository.findById(id);
        if (!personLicense) {
            throw new badRequestError_1.BadRequestError("Associa\u00E7\u00E3o de pessoa e licen\u00E7a n\u00E3o encontrada");
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
        if (data.person) {
            const person = await this.personRepository.findById(data.person);
            if (!person) {
                throw new badRequestError_1.BadRequestError("Pessoa n\u00E3o encontrada");
            }
        }
        if (data.license) {
            const license = await this.licenseRepository.findById(data.license);
            if (!license) {
                throw new badRequestError_1.BadRequestError("Licen\u00E7a n\u00E3o encontrada");
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