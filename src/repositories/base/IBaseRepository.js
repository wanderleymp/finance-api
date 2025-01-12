/**
 * Interface base para repositórios
 * @interface
 */
class IBaseRepository {
    /**
     * Cria um novo registro
     * @param {Object} data - Dados para criação
     * @returns {Promise<Object>} Registro criado
     */
    async create(data) {}

    /**
     * Busca todos os registros com paginação e filtros
     * @param {number} page - Número da página
     * @param {number} limit - Limite de registros por página
     * @param {Object} filters - Filtros de busca
     * @returns {Promise<{data: Array, total: number, page: number, limit: number}>} Resultado da busca
     */
    async findAll(page = 1, limit = 10, filters = {}) {}

    /**
     * Busca um registro por ID
     * @param {number} id - ID do registro
     * @returns {Promise<Object|null>} Registro encontrado
     */
    async findById(id) {}

    /**
     * Atualiza um registro
     * @param {number} id - ID do registro
     * @param {Object} data - Dados para atualização
     * @returns {Promise<Object>} Registro atualizado
     */
    async update(id, data) {}

    /**
     * Remove um registro
     * @param {number} id - ID do registro
     * @returns {Promise<boolean>} Sucesso da remoção
     */
    async delete(id) {}
}

module.exports = IBaseRepository;
