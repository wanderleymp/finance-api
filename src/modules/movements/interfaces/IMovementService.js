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
     * @param {number} [filters.person_id] - ID da pessoa
     * @param {number} [filters.movement_type_id] - ID do tipo de movimento
     * @param {number} [filters.movement_status_id] - ID do status do movimento
     * @param {number} [filters.value_min] - Valor mínimo
     * @param {number} [filters.value_max] - Valor máximo
     * @param {string} [filters.search] - Busca textual em description e full_name
     * @param {string} [filters.movement_date_start] - Data inicial
     * @param {string} [filters.movement_date_end] - Data final
     * @returns {Promise<object>} Lista paginada de movimentos
     */
    async findAll(page, limit, filters) {
        throw new Error('Method not implemented');
    }
}

module.exports = IMovementService;
