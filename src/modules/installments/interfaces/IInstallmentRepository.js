/**
 * Interface para o repositório de parcelas
 * @interface IInstallmentRepository
 */
class IInstallmentRepository {
    /**
     * Busca parcela por ID
     * @param {number} id - ID da parcela
     * @returns {Promise<object>} Parcela encontrada
     */
    async findById(id) {
        throw new Error('Method not implemented');
    }

    /**
     * Lista parcelas com paginação e filtros
     * @param {number} page - Número da página
     * @param {number} limit - Limite de itens por página
     * @param {object} filters - Filtros aplicados
     * @returns {Promise<object>} Lista paginada de parcelas
     */
    async findAll(page, limit, filters) {
        throw new Error('Method not implemented');
    }
}

module.exports = IInstallmentRepository;
