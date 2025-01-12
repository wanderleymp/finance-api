const { logger } = require('../../middlewares/logger');
const NfseRepository = require('./nfse.repository');
const CreateNfseDto = require('./dto/create-nfse.dto');
const UpdateNfseDto = require('./dto/update-nfse.dto');
const { NotFoundError, ValidationError } = require('../../utils/errors');

class NfseService {
    constructor(repository) {
        this.repository = repository;
    }

    /**
     * Cria uma nova NFSE
     * @param {Object} data - Dados da NFSE
     * @returns {Promise<Object>} NFSE criada
     */
    async create(data) {
        try {
            const createNfseDto = new CreateNfseDto(data);

            const nfse = await this.repository.create(createNfseDto);
            logger.info('NFSE criada com sucesso', { nfseId: nfse.nfse_id });
            return nfse;
        } catch (error) {
            logger.error('Erro ao criar NFSE', { error, data });
            throw error;
        }
    }

    /**
     * Atualiza uma NFSE
     * @param {number} id - ID da NFSE
     * @param {Object} data - Dados para atualização
     * @returns {Promise<Object>} NFSE atualizada
     */
    async update(id, data) {
        try {
            const existingNfse = await this.repository.findById(id);
            if (!existingNfse) {
                throw new NotFoundError('NFSE não encontrada');
            }

            const updateData = { ...existingNfse, ...data };
            const updateNfseDto = new UpdateNfseDto(updateData);

            const nfse = await this.repository.update(id, updateNfseDto);
            logger.info('NFSE atualizada com sucesso', { nfseId: id });
            return nfse;
        } catch (error) {
            logger.error('Erro ao atualizar NFSE', { error, id, data });
            throw error;
        }
    }

    /**
     * Busca uma NFSE por ID
     * @param {number} id - ID da NFSE
     * @returns {Promise<Object>} NFSE encontrada
     */
    async findById(id) {
        try {
            const nfse = await this.repository.findById(id);
            if (!nfse) {
                throw new NotFoundError('NFSE não encontrada');
            }
            return nfse;
        } catch (error) {
            logger.error('Erro ao buscar NFSE por ID', { error, id });
            throw error;
        }
    }

    /**
     * Busca NFSes por ID de invoice
     * @param {number} invoiceId - ID da invoice
     * @returns {Promise<Array>} Lista de NFSes
     */
    async findByInvoiceId(invoiceId) {
        try {
            if (!invoiceId) {
                throw new ValidationError('ID da invoice é obrigatório');
            }
            return await this.repository.findByInvoiceId(invoiceId);
        } catch (error) {
            logger.error('Erro ao buscar NFSes por invoice ID', { error, invoiceId });
            throw error;
        }
    }

    /**
     * Busca NFSes por ID de integração
     * @param {string} integrationNfseId - ID de integração da NFSE
     * @returns {Promise<Array>} Lista de NFSes
     */
    async findByIntegrationId(integrationNfseId) {
        try {
            if (!integrationNfseId) {
                throw new ValidationError('ID de integração é obrigatório');
            }
            return await this.repository.findByIntegrationId(integrationNfseId);
        } catch (error) {
            logger.error('Erro ao buscar NFSes por ID de integração', { error, integrationNfseId });
            throw error;
        }
    }

    /**
     * Lista NFSes com paginação e filtros
     * @param {Object} options - Opções de listagem
     * @param {number} options.page - Número da página
     * @param {number} options.limit - Limite de itens por página
     * @param {Object} options.filters - Filtros de busca
     * @returns {Promise<{items: Array, meta: Object, links: Object}>} Resultado da busca
     */
    async list({ page = 1, limit = 10, ...filters } = {}) {
        try {
            const result = await this.repository.findAll(page, limit, filters);
            return result;
        } catch (error) {
            logger.error('Erro ao listar NFSes', { error, page, limit, filters });
            throw error;
        }
    }

    /**
     * Remove uma NFSE
     * @param {number} id - ID da NFSE
     * @returns {Promise<boolean>} Sucesso da remoção
     */
    async delete(id) {
        try {
            const existingNfse = await this.repository.findById(id);
            if (!existingNfse) {
                throw new NotFoundError('NFSE não encontrada');
            }

            await this.repository.delete(id);
            logger.info('NFSE removida com sucesso', { nfseId: id });
            return true;
        } catch (error) {
            logger.error('Erro ao remover NFSE', { error, id });
            throw error;
        }
    }
}

module.exports = NfseService;
