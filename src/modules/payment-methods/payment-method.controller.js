const { logger } = require('../../middlewares/logger');
const { handleResponse, handleError } = require('../../utils/responseHandler');
const paymentMethodSchema = require('./schemas/payment-method.schema');

class PaymentMethodController {
    constructor(paymentMethodService) {
        this.service = paymentMethodService;
    }

    /**
     * Lista formas de pagamento
     */
    async findAll(req, res) {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;
            logger.info('Controller: Listando formas de pagamento', { page, limit, filters });

            const result = await this.service.findAll(
                parseInt(page),
                parseInt(limit),
                filters
            );

            handleResponse(res, result);
        } catch (error) {
            handleError(res, error);
        }
    }

    /**
     * Busca forma de pagamento por ID
     */
    async findById(req, res) {
        try {
            const { id } = req.params;
            logger.info('Controller: Buscando forma de pagamento por ID', { id });

            const result = await this.service.findById(id);
            handleResponse(res, result);
        } catch (error) {
            handleError(res, error);
        }
    }

    /**
     * Cria uma nova forma de pagamento
     */
    async create(req, res) {
        try {
            const data = req.body;
            logger.info('Controller: Criando forma de pagamento', { data });

            const result = await this.service.create(data);
            handleResponse(res, result, 201);
        } catch (error) {
            handleError(res, error);
        }
    }

    /**
     * Atualiza uma forma de pagamento
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            logger.info('Controller: Atualizando forma de pagamento', { id, data });

            const result = await this.service.update(id, data);
            handleResponse(res, result);
        } catch (error) {
            handleError(res, error);
        }
    }

    /**
     * Remove uma forma de pagamento
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            logger.info('Controller: Removendo forma de pagamento', { id });

            await this.service.delete(id);
            handleResponse(res, null, 204);
        } catch (error) {
            handleError(res, error);
        }
    }
}

module.exports = PaymentMethodController;
