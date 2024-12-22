class IBaseRepository {
    /**
     * Busca todos os registros com paginação
     * @param {Object} filters - Filtros de busca
     * @param {number} page - Página atual
     * @param {number} limit - Limite de registros por página
     * @returns {Promise<{data: Array, total: number}>}
     */
    async findAll(filters, page, limit) {
        throw new Error('Método findAll deve ser implementado');
    }

    /**
     * Busca registro por ID
     * @param {number} id - ID do registro
     * @returns {Promise<Object>}
     */
    async findById(id) {
        throw new Error('Método findById deve ser implementado');
    }

    /**
     * Cria um novo registro
     * @param {Object} data - Dados para criação
     * @returns {Promise<Object>}
     */
    async create(data) {
        throw new Error('Método create deve ser implementado');
    }

    /**
     * Atualiza um registro
     * @param {number} id - ID do registro
     * @param {Object} data - Dados para atualização
     * @returns {Promise<Object>}
     */
    async update(id, data) {
        throw new Error('Método update deve ser implementado');
    }

    /**
     * Remove um registro
     * @param {number} id - ID do registro
     * @returns {Promise<Object>}
     */
    async delete(id) {
        throw new Error('Método delete deve ser implementado');
    }
}

module.exports = IBaseRepository;
