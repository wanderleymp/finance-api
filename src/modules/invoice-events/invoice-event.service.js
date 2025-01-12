const { logger } = require('../../middlewares/logger');
const InvoiceEventRepository = require('./invoice-event.repository');
const CreateInvoiceEventDto = require('./dto/create-invoice-event.dto');
const UpdateInvoiceEventDto = require('./dto/update-invoice-event.dto');
const { NotFoundError, ValidationError } = require('../../utils/errors');

class InvoiceEventService {
    constructor(repository) {
        this.repository = repository;
    }

    /**
     * Cria um novo evento de invoice
     * @param {Object} data - Dados do evento
     * @returns {Promise<Object>} Evento criado
     */
    async create(data) {
        try {
            const createInvoiceEventDto = new CreateInvoiceEventDto(data);

            const event = await this.repository.create(createInvoiceEventDto);
            logger.info('Evento de invoice criado com sucesso', { eventId: event.event_id });
            return event;
        } catch (error) {
            logger.error('Erro ao criar evento de invoice', { error, data });
            throw error;
        }
    }

    /**
     * Atualiza um evento de invoice
     * @param {number} id - ID do evento
     * @param {Object} data - Dados para atualização
     * @returns {Promise<Object>} Evento atualizado
     */
    async update(id, data) {
        try {
            const existingEvent = await this.repository.findById(id);
            if (!existingEvent) {
                throw new NotFoundError('Evento de invoice não encontrado');
            }

            const updateData = { ...existingEvent, ...data };
            const updateInvoiceEventDto = new UpdateInvoiceEventDto(updateData);

            const event = await this.repository.update(id, updateInvoiceEventDto);
            logger.info('Evento de invoice atualizado com sucesso', { eventId: id });
            return event;
        } catch (error) {
            logger.error('Erro ao atualizar evento de invoice', { error, id, data });
            throw error;
        }
    }

    /**
     * Busca um evento por ID
     * @param {number} id - ID do evento
     * @returns {Promise<Object>} Evento encontrado
     */
    async findById(id) {
        try {
            const event = await this.repository.findById(id);
            if (!event) {
                throw new NotFoundError('Evento de invoice não encontrado');
            }
            return event;
        } catch (error) {
            logger.error('Erro ao buscar evento de invoice por ID', { error, id });
            throw error;
        }
    }

    /**
     * Busca eventos por ID de invoice
     * @param {number} invoiceId - ID da invoice
     * @returns {Promise<Array>} Lista de eventos
     */
    async findByInvoiceId(invoiceId) {
        try {
            if (!invoiceId) {
                throw new ValidationError('ID da invoice é obrigatório');
            }
            return await this.repository.findByInvoiceId(invoiceId);
        } catch (error) {
            logger.error('Erro ao buscar eventos por invoice ID', { error, invoiceId });
            throw error;
        }
    }

    /**
     * Lista eventos com paginação e filtros
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
            logger.error('Erro ao listar eventos de invoice', { error, page, limit, filters });
            throw error;
        }
    }

    /**
     * Remove um evento de invoice
     * @param {number} id - ID do evento
     * @returns {Promise<boolean>} Sucesso da remoção
     */
    async delete(id) {
        try {
            const existingEvent = await this.repository.findById(id);
            if (!existingEvent) {
                throw new NotFoundError('Evento de invoice não encontrado');
            }

            await this.repository.delete(id);
            logger.info('Evento de invoice removido com sucesso', { eventId: id });
            return true;
        } catch (error) {
            logger.error('Erro ao remover evento de invoice', { error, id });
            throw error;
        }
    }
}

module.exports = InvoiceEventService;
