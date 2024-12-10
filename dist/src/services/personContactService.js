"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonContactService = void 0;
const personContactRepository_1 = require("../repositories/personContactRepository");
const personRepository_1 = require("../repositories/personRepository");
const contactRepository_1 = require("../repositories/contactRepository");
const apiErrors_1 = require("../utils/apiErrors");
class PersonContactService {
    personContactRepository;
    personRepository;
    contactRepository;
    constructor() {
        this.personContactRepository = new personContactRepository_1.PersonContactRepository();
        this.personRepository = new personRepository_1.PersonRepository();
        this.contactRepository = new contactRepository_1.ContactRepository();
    }
    async createPersonContact(personContactData) {
        // Validações básicas
        if (!personContactData.person || !personContactData.contact) {
            throw new apiErrors_1.ApiError("Pessoa e contato s\u00E3o obrigat\u00F3rios", 400);
        }
        // Verificar se a pessoa existe
        await this.personRepository.findById(personContactData.person.connect?.id || "");
        // Verificar se o contato existe
        await this.contactRepository.findById(personContactData.contact.connect?.id || "");
        // Verificar se já existe este relacionamento
        const existingPersonContact = await this.personContactRepository.findByPersonAndContact(personContactData.person.connect?.id || "", personContactData.contact.connect?.id || "");
        if (existingPersonContact) {
            throw new apiErrors_1.ApiError("Relacionamento pessoa-contato j\u00E1 existe", 409);
        }
        return this.personContactRepository.create(personContactData);
    }
    async getPersonContactById(id) {
        const personContact = await this.personContactRepository.findById(id);
        if (!personContact) {
            throw new apiErrors_1.ApiError("Relacionamento pessoa-contato n\u00E3o encontrado", 404);
        }
        return personContact;
    }
    async updatePersonContact(id, personContactData) {
        // Verificar se o relacionamento existe
        await this.getPersonContactById(id);
        return this.personContactRepository.update(id, personContactData);
    }
    async deletePersonContact(id) {
        // Verificar se o relacionamento existe
        await this.getPersonContactById(id);
        return this.personContactRepository.delete(id);
    }
    async findPersonContacts(params) {
        return this.personContactRepository.findAll(params);
    }
}
exports.PersonContactService = PersonContactService;
//# sourceMappingURL=personContactService.js.map