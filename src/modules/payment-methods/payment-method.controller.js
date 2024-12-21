const { logger } = require('../../middlewares/logger');
const { validateRequest } = require('../../middlewares/validator');
const paymentMethodSchema = require('./schemas/payment-method.schema');

class PaymentMethodController {
    constructor({ paymentMethodService }) {
        this.paymentMethodService = paymentMethodService;
    }

    /**
     * Lista formas de pagamento
     */
    async index(req, res, next) {
        try {
            // Valida os parâmetros da requisição
            await validateRequest(req, 'query', paymentMethodSchema.list);

            const { page = 1, limit = 10, ...filters } = req.query;
            logger.info('Controller: Listando formas de pagamento', { page, limit, filters });

            const result = await this.paymentMethodService.findAll(
                parseInt(page),
                parseInt(limit),
                filters
            );

            return res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Busca forma de pagamento por ID
     */
    async show(req, res, next) {
        try {
            // Valida os parâmetros da requisição
            await validateRequest(req, 'params', paymentMethodSchema.getById);

            const { id } = req.params;
            logger.info('Controller: Buscando forma de pagamento', { id });

            const result = await this.paymentMethodService.findById(parseInt(id));
            if (!result) {
                return res.status(404).json({ message: 'Forma de pagamento não encontrada' });
            }

            return res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cria uma nova forma de pagamento
     */
    async store(req, res, next) {
        try {
            // Valida os parâmetros da requisição
            await validateRequest(req, 'body', paymentMethodSchema.create);

            logger.info('Controller: Criando forma de pagamento', { data: req.body });

            const result = await this.paymentMethodService.create(req.body);
            return res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Atualiza uma forma de pagamento
     */
    async update(req, res, next) {
        try {
            // Valida os parâmetros da requisição
            await validateRequest(req, 'params', paymentMethodSchema.getById);
            await validateRequest(req, 'body', paymentMethodSchema.update);

            const { id } = req.params;
            logger.info('Controller: Atualizando forma de pagamento', { id, data: req.body });

            const result = await this.paymentMethodService.update(parseInt(id), req.body);
            if (!result) {
                return res.status(404).json({ message: 'Forma de pagamento não encontrada' });
            }

            return res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Remove uma forma de pagamento
     */
    async destroy(req, res, next) {
        try {
            // Valida os parâmetros da requisição
            await validateRequest(req, 'params', paymentMethodSchema.delete);

            const { id } = req.params;
            logger.info('Controller: Removendo forma de pagamento', { id });

            const result = await this.paymentMethodService.delete(parseInt(id));
            if (!result) {
                return res.status(404).json({ message: 'Forma de pagamento não encontrada' });
            }

            return res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = PaymentMethodController;
