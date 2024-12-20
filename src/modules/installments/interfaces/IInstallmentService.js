/**
 * Interface para o serviço de parcelas
 * @interface IInstallmentService
 */
class IInstallmentService {
    /**
     * Busca parcela por ID
     * @param {number} id - ID da parcela
     * @returns {Promise<object>} Parcela encontrada
     */
    async getInstallmentById(id) {
        throw new Error('Method not implemented');
    }

    /**
     * Lista parcelas com paginação e filtros
     * @param {number} page - Número da página
     * @param {number} limit - Limite de itens por página
     * @param {object} filters - Filtros aplicados
     * @returns {Promise<object>} Lista paginada de parcelas
     */
    async listInstallments(page, limit, filters) {
        throw new Error('Method not implemented');
    }
}

module.exports = IInstallmentService;
