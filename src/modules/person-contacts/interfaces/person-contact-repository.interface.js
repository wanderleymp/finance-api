class IPersonContactRepository {
    /**
     * Lista todos os person-contacts com paginação
     */
    async findAll(page, limit, filters) {
        throw new Error('Método não implementado');
    }

    /**
     * Busca um person-contact pelo ID
     */
    async findById(id) {
        throw new Error('Método não implementado');
    }

    /**
     * Busca contatos de uma pessoa
     */
    async findByPersonId(personId) {
        throw new Error('Método não implementado');
    }

    /**
     * Cria uma nova associação entre pessoa e contato
     */
    async create(data) {
        throw new Error('Método não implementado');
    }

    /**
     * Remove uma associação entre pessoa e contato
     */
    async delete(id) {
        throw new Error('Método não implementado');
    }
}

module.exports = IPersonContactRepository;
