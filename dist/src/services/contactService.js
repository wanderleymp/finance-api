"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactService = void 0;
const contactRepository_1 = require("../repositories/contactRepository");
const apiErrors_1 = require("../utils/apiErrors");
class ContactService {
    contactRepository;
    constructor() {
        this.contactRepository = new contactRepository_1.ContactRepository();
    }
    async createContact(data) {
        // Validações básicas
        if (!data.type || !data.value) {
            throw new apiErrors_1.ApiError('Tipo e valor do contato são obrigatórios', 400);
        }
        // Verificar se já existe um contato com o mesmo tipo e valor
        const existingContact = await this.contactRepository.findByTypeAndValue(data.type, data.value);
        if (existingContact) {
            throw new apiErrors_1.ApiError('Contato já existe', 409);
        }
        return this.contactRepository.create(data);
    }
    async getContactById(id) {
        const contact = await this.contactRepository.findById(id);
        if (!contact) {
            throw new apiErrors_1.ApiError('Contato não encontrado', 404);
        }
        return contact;
    }
    async listContacts(params) {
        const { page = 1, limit = 10, type } = params;
        const skip = (page - 1) * limit;
        const where = type
            ? { type: type }
            : {};
        const [contacts, total] = await Promise.all([
            this.contactRepository.findAll({
                skip,
                take: limit,
                where,
                orderBy: { type: 'asc' }
            }),
            this.contactRepository.count(where)
        ]);
        return {
            contacts,
            total,
            page,
            limit
        };
    }
    async updateContact(id, contactData) {
        // Verificar se o contato existe
        await this.getContactById(id);
        // Se estiver atualizando tipo ou valor, verificar conflitos
        if (contactData.type || contactData.value) {
            const existingContact = await this.contactRepository.findByTypeAndValue(contactData.type, contactData.value);
            if (existingContact && existingContact.id !== id) {
                throw new apiErrors_1.ApiError('Contato com este tipo e valor já existe', 409);
            }
        }
        return this.contactRepository.update(id, contactData);
    }
    async deleteContact(id) {
        // Verificar se o contato existe
        await this.getContactById(id);
        return this.contactRepository.delete(id);
    }
    async findContacts(params) {
        const processedParams = {
            ...params,
            where: {
                ...params?.where,
                value: params?.where?.value
                    ? { contains: params.where.value, mode: 'insensitive' }
                    : undefined
            }
        };
        return this.contactRepository.findAll(processedParams);
    }
    async countContacts(where) {
        return this.contactRepository.count(where);
    }
}
exports.ContactService = ContactService;
//# sourceMappingURL=contactService.js.map