class IPersonRepository {
    /**
     * Busca todas as pessoas com filtros e paginação
     * @param {Object} filters - Filtros para busca
     * @param {number} page - Número da página
     * @param {number} limit - Limite de registros por página
     * @returns {Promise<{data: Array, total: number, page: number, limit: number}>}
     */
    async findAll(filters = {}, page = 1, limit = 10) {
        throw new Error('Método findAll deve ser implementado');
    }

    /**
     * Busca uma pessoa por ID
     * @param {number} id - ID da pessoa
     * @returns {Promise<Object|null>}
     */
    async findById(id) {
        throw new Error('Método findById deve ser implementado');
    }

    /**
     * Busca uma pessoa por documento
     * @param {string} document - Documento da pessoa (CPF/CNPJ)
     * @returns {Promise<Object|null>}
     */
    async findByDocument(document) {
        throw new Error('Método findByDocument deve ser implementado');
    }

    /**
     * Busca detalhes completos de uma pessoa, incluindo endereços e contatos
     * @param {number} id - ID da pessoa
     * @returns {Promise<Object|null>}
     */
    async findPersonWithDetails(id) {
        throw new Error('Método findPersonWithDetails deve ser implementado');
    }

    /**
     * Cria uma nova pessoa
     * @param {Object} data - Dados da pessoa
     * @returns {Promise<Object>}
     */
    async create(data) {
        throw new Error('Método create deve ser implementado');
    }

    /**
     * Atualiza uma pessoa
     * @param {number} id - ID da pessoa
     * @param {Object} data - Dados para atualização
     * @returns {Promise<Object|null>}
     */
    async update(id, data) {
        throw new Error('Método update deve ser implementado');
    }

    /**
     * Deleta uma pessoa
     * @param {number} id - ID da pessoa
     * @returns {Promise<Object|null>}
     */
    async delete(id) {
        throw new Error('Método delete deve ser implementado');
    }

    /**
     * Busca documentos de uma pessoa por ID
     * @param {number} personId - ID da pessoa
     * @returns {Promise<Array<{id: number, type: string, value: string}>>}
     */
    async findPersonDocuments(personId) {
        throw new Error('Método findPersonDocuments deve ser implementado');
    }
}

module.exports = IPersonRepository;
