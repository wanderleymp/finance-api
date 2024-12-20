/**
 * @interface IBoletoRepository
 * @description Interface para o repositório de boletos
 */
class IBoletoRepository {
    /**
     * Cria um novo boleto
     * @param {Object} data Dados do boleto
     * @returns {Promise<Object>} Boleto criado
     */
    async createBoleto(data) {}

    /**
     * Lista boletos com paginação e filtros
     * @param {number} page Número da página
     * @param {number} limit Limite por página
     * @param {Object} filters Filtros
     * @returns {Promise<Object>} Lista paginada de boletos
     */
    async findAll(page, limit, filters) {}

    /**
     * Busca um boleto por ID
     * @param {number} id ID do boleto
     * @returns {Promise<Object>} Boleto encontrado
     */
    async findById(id) {}

    /**
     * Atualiza um boleto
     * @param {number} id ID do boleto
     * @param {Object} data Dados para atualização
     * @returns {Promise<Object>} Boleto atualizado
     */
    async update(id, data) {}

    /**
     * Busca parcelas de um movimento
     * @param {number} movimentoId ID do movimento
     * @returns {Promise<Array>} Lista de parcelas
     */
    async getParcelasMovimento(movimentoId) {}

    /**
     * Atualiza o status de um boleto
     * @param {number} id ID do boleto
     * @param {string} status Novo status
     * @param {Object} responseData Dados de resposta da integradora
     * @returns {Promise<Object>} Boleto atualizado
     */
    async updateStatus(id, status, responseData) {}
}

module.exports = IBoletoRepository;
