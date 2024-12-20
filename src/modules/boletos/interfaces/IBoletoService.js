/**
 * @interface IBoletoService
 * @description Interface para o serviço de boletos
 */
class IBoletoService {
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
    async listBoletos(page, limit, filters) {}

    /**
     * Busca um boleto por ID
     * @param {number} id ID do boleto
     * @returns {Promise<Object>} Boleto encontrado
     */
    async getBoletoById(id) {}

    /**
     * Atualiza um boleto
     * @param {number} id ID do boleto
     * @param {Object} data Dados para atualização
     * @returns {Promise<Object>} Boleto atualizado
     */
    async updateBoleto(id, data) {}

    /**
     * Emite boletos para um movimento
     * @param {number} movimentoId ID do movimento
     * @returns {Promise<Array>} Lista de boletos emitidos
     */
    async emitirBoletosMovimento(movimentoId) {}

    /**
     * Processa um boleto (geração na integradora)
     * @param {number} boletoId ID do boleto
     * @returns {Promise<void>}
     */
    async processBoleto(boletoId) {}

    /**
     * Cancela um boleto
     * @param {number} id ID do boleto
     * @returns {Promise<Object>} Boleto cancelado
     */
    async cancelBoleto(id) {}
}

module.exports = IBoletoService;
