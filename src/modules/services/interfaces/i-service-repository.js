/**
 * Interface para repositório de serviços
 * @interface IServiceRepository
 */
class IServiceRepository {
    /**
     * Cria um novo serviço
     * @param {Object} data - Dados do serviço
     * @returns {Promise<Object>} Serviço criado
     */
    async create(data) {
        throw new Error('Método create deve ser implementado');
    }

    /**
     * Atualiza um serviço existente
     * @param {number} id - ID do serviço
     * @param {Object} data - Dados para atualização
     * @returns {Promise<Object>} Serviço atualizado
     */
    async update(id, data) {
        throw new Error('Método update deve ser implementado');
    }

    /**
     * Remove um serviço
     * @param {number} id - ID do serviço
     * @returns {Promise<boolean>} Sucesso da remoção
     */
    async delete(id) {
        throw new Error('Método delete deve ser implementado');
    }

    /**
     * Busca serviços com filtros
     * @param {Object} filters - Filtros de busca
     * @param {number} page - Página atual
     * @param {number} limit - Limite de resultados
     * @returns {Promise<Object>} Resultado da busca
     */
    async findAll(filters, page, limit) {
        throw new Error('Método findAll deve ser implementado');
    }

    /**
     * Busca detalhes de um serviço
     * @param {number} itemId - ID do item de serviço
     * @returns {Promise<Object>} Detalhes do serviço
     */
    async findServiceDetails(itemId) {
        throw new Error('Método findServiceDetails deve ser implementado');
    }
}

module.exports = IServiceRepository;
