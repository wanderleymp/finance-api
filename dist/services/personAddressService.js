"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonAddressService = void 0;
const personAddressRepository_1 = require("../repositories/personAddressRepository");
const personRepository_1 = require("../repositories/personRepository");
const apiErrors_1 = require("../utils/apiErrors");
class PersonAddressService {
    personAddressRepository;
    personRepository;
    constructor() {
        this.personAddressRepository = new personAddressRepository_1.PersonAddressRepository();
        this.personRepository = new personRepository_1.PersonRepository();
    }
    async createPersonAddress(personAddressData) {
        // Validações básicas
        if (!personAddressData.person) {
            throw new apiErrors_1.BadRequestError('Pessoa é obrigatória');
        }
        // Campos obrigatórios
        const requiredFields = [
            'street', 'neighborhood', 'city', 'state', 'zipCode'
        ];
        requiredFields.forEach(field => {
            if (!personAddressData[field]) {
                throw new apiErrors_1.BadRequestError(`${field} é obrigatório`);
            }
        });
        // Verificar se a pessoa existe
        await this.personRepository.findById(personAddressData.person.connect?.id || '');
        // Se for definido como endereço principal, remover outros endereços principais
        if (personAddressData.isMain) {
            const mainAddress = await this.personAddressRepository.findMainAddressByPersonId(personAddressData.person.connect?.id || '');
            if (mainAddress) {
                await this.personAddressRepository.update(mainAddress.id, { isMain: false });
            }
        }
        return this.personAddressRepository.create(personAddressData);
    }
    async getPersonAddressById(id) {
        const personAddress = await this.personAddressRepository.findById(id);
        if (!personAddress) {
            throw new apiErrors_1.NotFoundError('Endereço não encontrado');
        }
        return personAddress;
    }
    async listPersonAddresses(params) {
        const { page = 1, limit = 10, personId, city, state } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (personId)
            where.personId = personId;
        if (city)
            where.city = { contains: city, mode: 'insensitive' };
        if (state)
            where.state = { contains: state, mode: 'insensitive' };
        const [personAddresses, total] = await Promise.all([
            this.personAddressRepository.findAll({
                skip,
                take: limit,
                where,
                orderBy: { createdAt: 'desc' }
            }),
            this.personAddressRepository.count(where)
        ]);
        return {
            personAddresses,
            total,
            page,
            limit
        };
    }
    async updatePersonAddress(id, personAddressData) {
        // Verificar se o endereço existe
        const existingAddress = await this.getPersonAddressById(id);
        // Se for definido como endereço principal, remover outros endereços principais
        if (personAddressData.isMain) {
            const mainAddress = await this.personAddressRepository.findMainAddressByPersonId(existingAddress.personId);
            if (mainAddress && mainAddress.id !== id) {
                await this.personAddressRepository.update(mainAddress.id, { isMain: false });
            }
        }
        return this.personAddressRepository.update(id, personAddressData);
    }
    async deletePersonAddress(id) {
        // Verificar se o endereço existe
        await this.getPersonAddressById(id);
        return this.personAddressRepository.delete(id);
    }
}
exports.PersonAddressService = PersonAddressService;
//# sourceMappingURL=personAddressService.js.map