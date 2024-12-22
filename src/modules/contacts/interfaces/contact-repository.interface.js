const IBaseRepository = require('../../../interfaces/baseRepository.interface');

class IContactRepository extends IBaseRepository {
    /**
     * Busca contatos por pessoa
     * @param {number} personId - ID da pessoa
     * @returns {Promise<Array>}
     */
    async findByPersonId(personId) {
        throw new Error('Método findByPersonId deve ser implementado');
    }

    /**
     * Busca contato principal da pessoa
     * @param {number} personId - ID da pessoa
     * @returns {Promise<Object>}
     */
    async findMainContactByPersonId(personId) {
        throw new Error('Método findMainContactByPersonId deve ser implementado');
    }
}

module.exports = IContactRepository;
