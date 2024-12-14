const personAddressRepository = require('../repositories/personAddressRepository');
const personService = require('./personService');
const { ValidationError } = require('../utils/errors');
const PaginationHelper = require('../utils/paginationHelper');

class PersonAddressService {
    async listPersonAddresses(page, limit, filters = {}) {
        const { page: validPage, limit: validLimit } = PaginationHelper.validateParams(page, limit);
        const { data, total } = await personAddressRepository.findAll(filters, validPage, validLimit);

        return PaginationHelper.formatResponse(data, total, validPage, validLimit);
    }

    async getPersonAddress(addressId) {
        const address = await personAddressRepository.findById(addressId);
        if (!address) {
            throw new ValidationError('Endereço não encontrado', 404);
        }
        return address;
    }

    async createPersonAddress(addressData) {
        // Validar se a pessoa existe
        await personService.getPerson(addressData.person_id);

        // Validar dados obrigatórios
        this.validateAddressData(addressData);

        return await personAddressRepository.create(addressData);
    }

    async updatePersonAddress(addressId, addressData) {
        // Verificar se o endereço existe
        await this.getPersonAddress(addressId);

        // Se person_id for fornecido, validar se a pessoa existe
        if (addressData.person_id) {
            await personService.getPerson(addressData.person_id);
        }

        return await personAddressRepository.update(addressId, addressData);
    }

    async deletePersonAddress(addressId) {
        // Verificar se o endereço existe
        await this.getPersonAddress(addressId);

        await personAddressRepository.delete(addressId);
    }

    validateAddressData(data) {
        const requiredFields = [
            'person_id', 'street', 'number', 'city', 
            'state', 'postal_code'
        ];

        for (const field of requiredFields) {
            if (!data[field]) {
                throw new ValidationError(`O campo ${field} é obrigatório`, 400);
            }
        }

        // Validações adicionais
        if (data.state && data.state.length !== 2) {
            throw new ValidationError('O estado deve ser uma sigla com 2 caracteres', 400);
        }

        if (data.postal_code && !/^\d{5}-?\d{3}$/.test(data.postal_code.replace(/\D/g, ''))) {
            throw new ValidationError('O CEP deve estar no formato 00000-000 ou 00000000', 400);
        }
    }
}

module.exports = new PersonAddressService();
