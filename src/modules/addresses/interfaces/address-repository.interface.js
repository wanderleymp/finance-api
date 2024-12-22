const IBaseRepository = require('../../../interfaces/baseRepository.interface');

class IAddressRepository extends IBaseRepository {
    /**
     * Busca endereços por pessoa
     * @param {number} personId - ID da pessoa
     * @returns {Promise<Array>}
     */
    async findByPersonId(personId) {
        throw new Error('Método findByPersonId deve ser implementado');
    }

    /**
     * Busca endereço principal da pessoa
     * @param {number} personId - ID da pessoa
     * @returns {Promise<Object>}
     */
    async findMainAddressByPersonId(personId) {
        throw new Error('Método findMainAddressByPersonId deve ser implementado');
    }
}

module.exports = IAddressRepository;
