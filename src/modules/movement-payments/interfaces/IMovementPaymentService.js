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

    /**
     * Cria um novo pagamento
     * @param {object} data - Dados do pagamento
     * @returns {Promise<object>} Pagamento criado
     */
    async create(data) {
        throw new Error('Method not implemented');
    }

    /**
     * Atualiza um pagamento existente
     * @param {number} id - ID do pagamento
     * @param {object} data - Dados do pagamento
     * @returns {Promise<object>} Pagamento atualizado
     */
    async update(id, data) {
        throw new Error('Method not implemented');
    }

    /**
     * Remove um pagamento
     * @param {number} id - ID do pagamento
     * @returns {Promise<object>} Pagamento removido
     */
    async delete(id) {
        throw new Error('Method not implemented');
    }
}

module.exports = IMovementPaymentService;
