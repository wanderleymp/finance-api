class IPersonContactRepository {
    /**
     * Busca contatos de uma pessoa
     * @param {number} personId - ID da pessoa
     * @returns {Promise<Array>} Lista de contatos
     */
    async findByPersonId(personId) {
        throw new Error('Método não implementado');
    }

    /**
     * Busca contato principal de uma pessoa
     * @param {number} personId - ID da pessoa
     * @returns {Promise<Object|null>} Contato principal ou null
     */
    async findMainContactByPersonId(personId) {
        throw new Error('Método não implementado');
    }

    /**
     * Cria um novo contato para uma pessoa
     * @param {Object} contactData - Dados do contato
     * @returns {Promise<Object>} Contato criado
     */
    async create(contactData) {
        throw new Error('Método não implementado');
    }

    /**
     * Atualiza um contato
     * @param {number} contactId - ID do contato
     * @param {Object} contactData - Dados atualizados
     * @returns {Promise<Object>} Contato atualizado
     */
    async update(contactId, contactData) {
        throw new Error('Método não implementado');
    }

    /**
     * Remove um contato
     * @param {number} contactId - ID do contato
     * @returns {Promise<Object>} Contato removido
     */
    async delete(contactId) {
        throw new Error('Método não implementado');
    }
}

module.exports = IPersonContactRepository;
