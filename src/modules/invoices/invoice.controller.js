const InvoiceService = require('./invoice.service');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { logger } = require('../../middlewares/logger');

class InvoiceController {
    constructor() {
        this.service = new InvoiceService();
    }

    async findAll(req, res) {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;
            
            // Log detalhado dos filtros recebidos
            logger.debug('InvoiceController.findAll - Filtros recebidos', {
                page,
                limit,
                filters: JSON.stringify(filters),
                fullQuery: JSON.stringify(req.query)
            });

            const result = await this.service.list({ page: Number(page), limit: Number(limit), ...filters });
            return successResponse(res, 200, result);
        } catch (error) {
            // Log detalhado do erro
            logger.error('InvoiceController.findAll - Erro', {
                error: error.message,
                stack: error.stack
            });
            return errorResponse(res, 500, 'Erro ao buscar faturas', error);
        }
    }

    async findById(req, res) {
        try {
            const { id } = req.params;
            const result = await this.service.findById(Number(id));
            return successResponse(res, result);
        } catch (error) {
            return errorResponse(res, error);
        }
    }

    async create(req, res) {
        try {
            const result = await this.service.create(req.body);
            return successResponse(res, result, 201);
        } catch (error) {
            return errorResponse(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const result = await this.service.update(Number(id), req.body);
            return successResponse(res, result);
        } catch (error) {
            return errorResponse(res, error);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await this.service.delete(Number(id));
            return successResponse(res, null, 204);
        } catch (error) {
            return errorResponse(res, error);
        }
    }

    // Métodos específicos de invoice podem ser adicionados aqui
    async findByReferenceId(req, res) {
        try {
            const { referenceId } = req.params;
            const result = await this.service.findByReferenceId(referenceId);
            return successResponse(res, result);
        } catch (error) {
            return errorResponse(res, error);
        }
    }
}

module.exports = InvoiceController;
