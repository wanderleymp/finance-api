/**
 * Interface para o repositório de pagamentos de movimentos
 * @interface IMovementPaymentRepository
 */
class IMovementPaymentRepository {
    /**
     * Busca pagamento por ID
     * @param {number} id - ID do pagamento
     * @returns {Promise<object>} Pagamento encontrado
     */
    async findById(id) {
        throw new Error('Method not implemented');
    }

    /**
     * Lista pagamentos com paginação e filtros
     * @param {number} page - Número da página
     * @param {number} limit - Limite de itens por página
     * @param {object} filters - Filtros aplicados
     * @returns {Promise<object>} Lista paginada de pagamentos
     */
    async findAll(page, limit, filters) {
        throw new Error('Method not implemented');
    }
}

module.exports = IMovementPaymentRepository;
