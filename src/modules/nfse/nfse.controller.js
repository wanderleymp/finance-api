const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { logger } = require('../../middlewares/logger');

class NfseController {
    constructor(service) {
        this.service = service;
    }

    /**
     * Lista todos os NFSes
     */
    async findAll(req, res) {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;
            
            logger.debug('NfseController.findAll - Filtros recebidos', {
                page,
                limit,
                filters: JSON.stringify(filters),
                fullQuery: JSON.stringify(req.query)
            });

            const result = await this.service.list({ page: Number(page), limit: Number(limit), ...filters });
            return successResponse(res, 200, result);
        } catch (error) {
            logger.error('NfseController.findAll - Erro', {
                error: error.message,
                stack: error.stack
            });
            return errorResponse(res, 500, 'Erro ao buscar NFSes', error);
        }
    }

    /**
     * Busca um NFSe por ID
     */
    async findById(req, res) {
        try {
            const { id } = req.params;
            const result = await this.service.findById(Number(id));
            return successResponse(res, 200, result);
        } catch (error) {
            logger.error('NfseController.findById - Erro', {
                error: error.message,
                id: req.params.id
            });
            return errorResponse(res, 404, 'NFSe não encontrado', error);
        }
    }

    /**
     * Busca NFSes por ID da invoice
     */
    async findByInvoiceId(req, res) {
        try {
            const { invoiceId } = req.params;
            const result = await this.service.findByInvoiceId(Number(invoiceId));
            return successResponse(res, 200, result);
        } catch (error) {
            logger.error('NfseController.findByInvoiceId - Erro', {
                error: error.message,
                invoiceId: req.params.invoiceId
            });
            return errorResponse(res, 404, 'NFSes não encontrados', error);
        }
    }

    /**
     * Busca NFSes por ID de integração
     */
    async findByIntegrationId(req, res) {
        try {
            const { integrationId } = req.params;
            const result = await this.service.findByIntegrationId(integrationId);
            return successResponse(res, 200, result);
        } catch (error) {
            logger.error('NfseController.findByIntegrationId - Erro', {
                error: error.message,
                integrationId: req.params.integrationId
            });
            return errorResponse(res, 404, 'NFSes não encontrados', error);
        }
    }

    /**
     * Cria um novo NFSe
     */
    async create(req, res) {
        try {
            const result = await this.service.create(req.body);
            return successResponse(res, 201, result);
        } catch (error) {
            logger.error('NfseController.create - Erro', {
                error: error.message,
                data: req.body
            });
            return errorResponse(res, 400, 'Erro ao criar NFSe', error);
        }
    }

    /**
     * Atualiza um NFSe
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const result = await this.service.update(Number(id), req.body);
            return successResponse(res, 200, result);
        } catch (error) {
            logger.error('NfseController.update - Erro', {
                error: error.message,
                id: req.params.id,
                data: req.body
            });
            return errorResponse(res, 400, 'Erro ao atualizar NFSe', error);
        }
    }

    /**
     * Remove um NFSe
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            await this.service.delete(Number(id));
            return successResponse(res, 204);
        } catch (error) {
            logger.error('NfseController.delete - Erro', {
                error: error.message,
                id: req.params.id
            });
            return errorResponse(res, 400, 'Erro ao remover NFSe', error);
        }
    }
}

module.exports = NfseController;
