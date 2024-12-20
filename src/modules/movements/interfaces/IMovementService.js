/**
 * Interface para o serviço de movimentos
 * @interface IMovementService
 */
class IMovementService {
    /**
     * Busca movimento por ID
     * @param {number} id - ID do movimento
     * @returns {Promise<object>} Movimento encontrado
     */
    async getMovementById(id) {
        throw new Error('Method not implemented');
    }

    /**
     * Lista movimentos com paginação e filtros
     * @param {number} page - Número da página
     * @param {number} limit - Limite de itens por página
     * @param {object} filters - Filtros aplicados
     * @returns {Promise<object>} Lista paginada de movimentos
     */
    async listMovements(page, limit, filters) {
        throw new Error('Method not implemented');
    }
}

module.exports = IMovementService;
