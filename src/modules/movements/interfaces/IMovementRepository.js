/**
 * Interface para o repositório de movimentos
 * @interface IMovementRepository
 */
class IMovementRepository {
    /**
     * Busca movimento por ID
     * @param {number} id - ID do movimento
     * @returns {Promise<object>} Movimento encontrado
     */
    async findById(id) {
        throw new Error('Method not implemented');
    }

    /**
     * Lista movimentos com paginação e filtros
     * @param {number} page - Número da página
     * @param {number} limit - Limite de itens por página
     * @param {object} filters - Filtros aplicados
     * @returns {Promise<object>} Lista paginada de movimentos
     */
    async findAll(page, limit, filters) {
        throw new Error('Method not implemented');
    }

    /**
     * Lista movimentos com dados relacionados (detalhado)
     * @param {number} page - Número da página
     * @param {number} limit - Limite de itens por página
     * @param {object} filters - Filtros aplicados
     * @returns {Promise<object>} Lista paginada de movimentos com dados relacionados
     */
    async findAllDetailed(page, limit, filters) {
        throw new Error('Method not implemented');
    }

    /**
     * Cria um novo movimento
     * @param {object} data - Dados do movimento
     * @param {string} data.description - Descrição do movimento
     * @param {string} data.type - Tipo do movimento (INCOME/EXPENSE)
     * @param {string} data.status - Status do movimento
     * @param {number} data.value - Valor do movimento
     * @param {Date} data.due_date - Data de vencimento
     * @param {number} data.person_id - ID da pessoa
     * @param {Array} [data.installments] - Lista de parcelas
     * @param {Array} [data.payments] - Lista de pagamentos
     * @returns {Promise<object>} Movimento criado
     */
    async create(data) {
        throw new Error('Method not implemented');
    }

    /**
     * Atualiza um movimento
     * @param {number} id - ID do movimento
     * @param {object} data - Dados para atualizar
     * @returns {Promise<object>} Movimento atualizado
     */
    async update(id, data) {
        throw new Error('Method not implemented');
    }

    /**
     * Remove um movimento
     * @param {number} id - ID do movimento
     * @returns {Promise<void>}
     */
    async delete(id) {
        throw new Error('Method not implemented');
    }

    /**
     * Atualiza o status de um movimento
     * @param {number} id - ID do movimento
     * @param {string} status - Novo status
     * @returns {Promise<object>} Movimento atualizado
     */
    async updateStatus(id, status) {
        throw new Error('Method not implemented');
    }
}

module.exports = IMovementRepository;
