/**
 * @interface ItemRepositoryInterface
 * @description Interface que define os métodos que um repositório de itens deve implementar
 */
class ItemRepositoryInterface {
    /**
     * @param {Object} filters Filtros para busca
     * @param {number} page Número da página
     * @param {number} limit Limite de itens por página
     * @returns {Promise<{data: Array, total: number, page: number, totalPages: number}>}
     */
    async findAll(filters, page, limit) {
        throw new Error('Method not implemented');
    }

    /**
     * @param {number} id ID do item
     * @returns {Promise<Object|null>}
     */
    async findById(id) {
        throw new Error('Method not implemented');
    }

    /**
     * @param {Object} data Dados do item
     * @returns {Promise<Object>}
     */
    async create(data) {
        throw new Error('Method not implemented');
    }

    /**
     * @param {number} id ID do item
     * @param {Object} data Dados para atualização
     * @returns {Promise<Object>}
     */
    async update(id, data) {
        throw new Error('Method not implemented');
    }

    /**
     * @param {number} id ID do item
     * @returns {Promise<void>}
     */
    async delete(id) {
        throw new Error('Method not implemented');
    }
}

module.exports = ItemRepositoryInterface;
