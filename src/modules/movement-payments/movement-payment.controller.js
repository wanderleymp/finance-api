const { logger } = require('../../middlewares/logger');
const IMovementPaymentService = require('./interfaces/IMovementPaymentService');

class MovementPaymentController {
    /**
     * @param {IMovementPaymentService} service Serviço de pagamentos
     */
    constructor(service) {
        this.service = service;
    }

    /**
     * Lista pagamentos
     */
    async index(req, res, next) {
        try {
            const { page, limit, ...filters } = req.query;
            
            logger.info('Controller: Listando pagamentos', { 
                page, 
                limit, 
                filters 
            });

            const result = await this.service.listPayments(
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
     * Busca pagamento por ID
     */
    async show(req, res, next) {
        try {
            const { id } = req.params;
            
            logger.info('Controller: Buscando pagamento por ID', { id });

            const payment = await this.service.getPaymentById(parseInt(id));

            return res.json(payment);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = MovementPaymentController;
