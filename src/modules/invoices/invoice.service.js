const { logger } = require('../../middlewares/logger');
const InvoiceRepository = require('./invoice.repository');
const CreateInvoiceDto = require('./dto/create-invoice.dto');
const UpdateInvoiceDto = require('./dto/update-invoice.dto');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class InvoiceService {
    constructor() {
        this.repository = new InvoiceRepository();
    }

    /**
     * Cria uma nova fatura
     * @param {Object} data - Dados da fatura
     * @returns {Promise<Object>} Fatura criada
     */
    async create(data) {
        try {
            const createInvoiceDto = new CreateInvoiceDto(data);

            const invoice = await this.repository.create(createInvoiceDto);
            logger.info('Fatura criada com sucesso', { invoiceId: invoice.invoice_id });
            return invoice;
        } catch (error) {
            logger.error('Erro ao criar fatura', { error, data });
            throw error;
        }
    }

    /**
     * Atualiza uma fatura
     * @param {number} id - ID da fatura
     * @param {Object} data - Dados para atualização
     * @returns {Promise<Object>} Fatura atualizada
     */
    async update(id, data) {
        try {
            const existingInvoice = await this.repository.findById(id);
            if (!existingInvoice) {
                throw new NotFoundError('Fatura não encontrada');
            }

            const updateData = { ...existingInvoice, ...data };
            const updateInvoiceDto = new UpdateInvoiceDto(updateData);

            const invoice = await this.repository.update(id, updateInvoiceDto);
            logger.info('Fatura atualizada com sucesso', { invoiceId: id });
            return invoice;
        } catch (error) {
            logger.error('Erro ao atualizar fatura', { error, id, data });
            throw error;
        }
    }

    /**
     * Busca uma fatura por ID
     * @param {number} id - ID da fatura
     * @returns {Promise<Object>} Fatura encontrada
     */
    async findById(id) {
        try {
            const invoice = await this.repository.findById(id);
            if (!invoice) {
                throw new NotFoundError('Fatura não encontrada');
            }
            return invoice;
        } catch (error) {
            logger.error('Erro ao buscar fatura por ID', { error, id });
            throw error;
        }
    }

    /**
     * Lista faturas com paginação e filtros
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
            logger.error('Erro ao listar faturas', { error, page, limit, filters });
            throw error;
        }
    }

    /**
     * Remove uma fatura
     * @param {number} id - ID da fatura
     * @returns {Promise<void>}
     */
    async delete(id) {
        try {
            const existingInvoice = await this.repository.findById(id);
            if (!existingInvoice) {
                throw new NotFoundError('Fatura não encontrada');
            }

            await this.repository.delete(id);
            logger.info('Fatura removida com sucesso', { invoiceId: id });
        } catch (error) {
            logger.error('Erro ao remover fatura', { error, id });
            throw error;
        }
    }

    /**
     * Busca faturas por referência
     * @param {string} referenceId - ID de referência da fatura
     * @returns {Promise<Array>} Lista de faturas
     */
    async findByReferenceId(referenceId) {
        try {
            const invoices = await this.repository.findByReferenceId(referenceId);
            return invoices;
        } catch (error) {
            logger.error('Erro ao buscar faturas por referência', { error, referenceId });
            throw error;
        }
    }

    /**
     * Busca faturas por status
     * @param {string} status - Status da fatura
     * @param {Object} options - Opções de busca
     * @returns {Promise<Array>} Lista de faturas
     */
    async findByStatus(status, options = {}) {
        try {
            const invoices = await this.repository.findByStatus(status, options);
            return invoices;
        } catch (error) {
            logger.error('Erro ao buscar faturas por status', { error, status, options });
            throw error;
        }
    }
}

module.exports = InvoiceService;
