/**
 * Interface para o serviço de pagamentos de movimentos
 * @interface IMovementPaymentService
 */
class IMovementPaymentService {
    /**
     * Busca pagamento por ID
     * @param {number} id - ID do pagamento
     * @returns {Promise<object>} Pagamento encontrado
     */
    async getPaymentById(id) {
        throw new Error('Method not implemented');
    }

    /**
     * Lista pagamentos com paginação e filtros
     * @param {number} page - Número da página
     * @param {number} limit - Limite de itens por página
     * @param {object} filters - Filtros aplicados
     * @returns {Promise<object>} Lista paginada de pagamentos
     */
    async listPayments(page, limit, filters) {
        throw new Error('Method not implemented');
    }
}

module.exports = IMovementPaymentService;
