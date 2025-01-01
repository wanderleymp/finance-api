const { logger } = require('../../middlewares/logger');
const { DatabaseError } = require('../../utils/errors');

class BoletoService {
    constructor({ boletoRepository }) {
        this.repository = boletoRepository;
    }

    /**
     * Lista boletos com paginação e filtros
     * @param {number} page - Número da página
     * @param {number} limit - Limite de itens por página
     * @param {object} filters - Filtros aplicados
     * @returns {Promise<object>} Lista paginada de boletos
     */
    async listBoletos(page = 1, limit = 10, filters = {}) {
        try {
            logger.info('Serviço: Listando boletos', { page, limit, filters });
            return await this.repository.findAll(page, limit, filters);
        } catch (error) {
            logger.error('Erro ao listar boletos', { error: error.message, filters });
            throw new DatabaseError('Erro ao listar boletos');
        }
    }

    /**
     * Lista boletos com detalhes, paginação e filtros
     * @param {number} page - Número da página
     * @param {number} limit - Limite de itens por página
     * @param {object} filters - Filtros aplicados
     * @returns {Promise<object>} Lista paginada de boletos com detalhes
     */
    async listBoletosWithDetails(page = 1, limit = 10, filters = {}) {
        try {
            logger.info('Serviço: Listando boletos com detalhes', { page, limit, filters });
            return await this.repository.findAllWithDetails(page, limit, filters);
        } catch (error) {
            logger.error('Erro ao listar boletos com detalhes', { error: error.message, filters });
            throw new DatabaseError('Erro ao listar boletos com detalhes');
        }
    }

    /**
     * Busca um boleto por ID
     * @param {number} id - ID do boleto
     * @returns {Promise<object>} Boleto encontrado
     */
    async getBoletoById(id) {
        try {
            logger.info('Serviço: Buscando boleto por ID', { id });
            return await this.repository.findById(id);
        } catch (error) {
            logger.error('Erro ao buscar boleto por ID', { error: error.message, id });
            throw new DatabaseError('Erro ao buscar boleto');
        }
    }

    /**
     * Busca um boleto por ID com detalhes
     * @param {number} id - ID do boleto
     * @returns {Promise<object>} Boleto encontrado com detalhes
     */
    async getBoletoByIdWithDetails(id) {
        try {
            logger.info('Serviço: Buscando boleto por ID com detalhes', { id });
            return await this.repository.findByIdWithDetails(id);
        } catch (error) {
            logger.error('Erro ao buscar boleto por ID com detalhes', { error: error.message, id });
            throw new DatabaseError('Erro ao buscar boleto com detalhes');
        }
    }

    /**
     * Cria um novo boleto
     * @param {object} data - Dados do boleto
     * @returns {Promise<object>} Boleto criado
     */
    async createBoleto(data) {
        try {
            logger.info('Serviço: Criando boleto', { data });
            return await this.repository.createBoleto(data);
        } catch (error) {
            logger.error('Erro ao criar boleto', { error: error.message, data });
            throw new DatabaseError('Erro ao criar boleto');
        }
    }

    /**
     * Atualiza um boleto existente
     * @param {number} id - ID do boleto
     * @param {object} data - Dados para atualização
     * @returns {Promise<object>} Boleto atualizado
     */
    async updateBoleto(id, data) {
        try {
            logger.info('Serviço: Atualizando boleto', { id, data });
            return await this.repository.updateBoleto(id, data);
        } catch (error) {
            logger.error('Erro ao atualizar boleto', { error: error.message, id, data });
            throw new DatabaseError('Erro ao atualizar boleto');
        }
    }
}

module.exports = BoletoService;
