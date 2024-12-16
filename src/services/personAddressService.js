const personAddressRepository = require('../repositories/personAddressRepository');
const personRepository = require('../repositories/personRepository');
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
        console.error('🚨 ENDEREÇO: Criando endereço', addressData);

        // Validar se a pessoa existe usando o repositório diretamente
        const { data: pessoa, total } = await personRepository.findById(addressData.person_id);
        
        console.error('🚨 ENDEREÇO: Verificando pessoa', { pessoa, total });

        if (!pessoa || total === 0) {
            throw new ValidationError('Pessoa não encontrada', 404);
        }

        // Validar dados obrigatórios
        this.validateAddressData(addressData);

        return await personAddressRepository.create(addressData);
    }

    async updatePersonAddress(addressId, addressData) {
        // Verificar se o endereço existe
        await this.getPersonAddress(addressId);

        // Se person_id for fornecido, validar se a pessoa existe
        if (addressData.person_id) {
            const { data: pessoa, total } = await personRepository.findById(addressData.person_id);
            if (!pessoa || total === 0) {
                throw new ValidationError('Pessoa não encontrada', 404);
            }
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
            'person_id', 'street', 'number', 
            'neighborhood', 'city', 'state', 
            'postal_code', 'country'
        ];

        for (const field of requiredFields) {
            if (!data[field]) {
                throw new ValidationError(`Campo ${field} é obrigatório`);
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
