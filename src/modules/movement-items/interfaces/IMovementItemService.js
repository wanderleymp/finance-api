/**
 * @interface IMovementItemService
 * @description Interface para o serviço de items de movimentação
 */
class IMovementItemService {
    /**
     * Cria um novo item de movimentação
     * @param {Object} data - Dados do item
     * @returns {Promise<Object>} Item criado
     */
    async create(data) {
        throw new Error('Method not implemented');
    }

    /**
     * Atualiza um item de movimentação
     * @param {number} id - ID do item
     * @param {Object} data - Dados para atualização
     * @returns {Promise<Object>} Item atualizado
     */
    async update(id, data) {
        throw new Error('Method not implemented');
    }

    /**
     * Busca um item de movimentação por ID
     * @param {number} id - ID do item
     * @returns {Promise<Object>} Item encontrado
     */
    async findById(id) {
        throw new Error('Method not implemented');
    }

    /**
     * Lista todos os itens de uma movimentação
     * @param {number} movementId - ID da movimentação
     * @returns {Promise<Array>} Lista de itens
     */
    async findByMovementId(movementId) {
        throw new Error('Method not implemented');
    }

    /**
     * Exclui um item de movimentação
     * @param {number} id - ID do item
     * @returns {Promise<void>}
     */
    async delete(id) {
        throw new Error('Method not implemented');
    }
}

module.exports = IMovementItemService;
