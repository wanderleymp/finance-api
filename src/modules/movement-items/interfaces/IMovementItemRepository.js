/**
 * @interface IMovementItemRepository
 * @description Interface para o repositório de items de movimentação
 */
class IMovementItemRepository {
    /**
     * Busca todos os itens de movimentação com filtros e paginação
     * @param {Object} filters - Filtros para busca
     * @param {number} page - Número da página
     * @param {number} limit - Limite de registros por página
     * @param {Object} order - Ordenação
     * @returns {Promise<{data: Array, total: number, page: number, limit: number}>}
     */
    async findAll(filters = {}, page = 1, limit = 10, order = {}) {
        throw new Error('Método findAll deve ser implementado');
    }

    /**
     * Busca um item por ID
     * @param {number} id - ID do item
     * @returns {Promise<Object|null>}
     */
    async findById(id) {
        throw new Error('Método findById deve ser implementado');
    }

    /**
     * Busca itens por ID da movimentação
     * @param {number} movementId - ID da movimentação
     * @returns {Promise<Array>}
     */
    async findByMovementId(movementId) {
        throw new Error('Método findByMovementId deve ser implementado');
    }

    /**
     * Cria um novo item
     * @param {Object} data - Dados do item
     * @returns {Promise<Object>}
     */
    async create(data) {
        throw new Error('Método create deve ser implementado');
    }

    /**
     * Atualiza um item
     * @param {number} id - ID do item
     * @param {Object} data - Dados para atualização
     * @returns {Promise<Object>}
     */
    async update(id, data) {
        throw new Error('Método update deve ser implementado');
    }

    /**
     * Remove um item
     * @param {number} id - ID do item
     * @returns {Promise<void>}
     */
    async delete(id) {
        throw new Error('Método delete deve ser implementado');
    }
}

module.exports = IMovementItemRepository;
