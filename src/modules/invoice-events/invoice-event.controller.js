const InvoiceEventService = require('./invoice-event.service');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { logger } = require('../../middlewares/logger');

class InvoiceEventController {
    constructor(service) {
        this.service = service;
    }

    /**
     * Lista todos os eventos de invoice
     */
    async findAll(req, res) {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;
            
            logger.debug('InvoiceEventController.findAll - Filtros recebidos', {
                page,
                limit,
                filters: JSON.stringify(filters),
                fullQuery: JSON.stringify(req.query)
            });

            const result = await this.service.list({ page: Number(page), limit: Number(limit), ...filters });
            return successResponse(res, 200, result);
        } catch (error) {
            logger.error('InvoiceEventController.findAll - Erro', {
                error: error.message,
                stack: error.stack
            });
            return errorResponse(res, 500, 'Erro ao buscar eventos de invoice', error);
        }
    }

    /**
     * Busca um evento de invoice por ID
     */
    async findById(req, res) {
        try {
            const { id } = req.params;
            const result = await this.service.findById(Number(id));
            return successResponse(res, 200, result);
        } catch (error) {
            logger.error('InvoiceEventController.findById - Erro', {
                error: error.message,
                id: req.params.id
            });
            return errorResponse(res, 404, 'Evento de invoice não encontrado', error);
        }
    }

    /**
     * Busca eventos de invoice por ID da invoice
     */
    async findByInvoiceId(req, res) {
        try {
            const { invoiceId } = req.params;
            const result = await this.service.findByInvoiceId(Number(invoiceId));
            return successResponse(res, 200, result);
        } catch (error) {
            logger.error('InvoiceEventController.findByInvoiceId - Erro', {
                error: error.message,
                invoiceId: req.params.invoiceId
            });
            return errorResponse(res, 404, 'Eventos de invoice não encontrados', error);
        }
    }

    /**
     * Cria um novo evento de invoice
     */
    async create(req, res) {
        try {
            const result = await this.service.create(req.body);
            return successResponse(res, 201, result);
        } catch (error) {
            logger.error('InvoiceEventController.create - Erro', {
                error: error.message,
                data: req.body
            });
            return errorResponse(res, 400, 'Erro ao criar evento de invoice', error);
        }
    }

    /**
     * Atualiza um evento de invoice
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const result = await this.service.update(Number(id), req.body);
            return successResponse(res, 200, result);
        } catch (error) {
            logger.error('InvoiceEventController.update - Erro', {
                error: error.message,
                id: req.params.id,
                data: req.body
            });
            return errorResponse(res, 400, 'Erro ao atualizar evento de invoice', error);
        }
    }

    /**
     * Remove um evento de invoice
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            await this.service.delete(Number(id));
            return successResponse(res, 204);
        } catch (error) {
            logger.error('InvoiceEventController.delete - Erro', {
                error: error.message,
                id: req.params.id
            });
            return errorResponse(res, 400, 'Erro ao remover evento de invoice', error);
        }
    }
}

module.exports = InvoiceEventController;
