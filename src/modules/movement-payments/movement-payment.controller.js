const { logger } = require('../../middlewares/logger');
const IMovementPaymentService = require('./interfaces/IMovementPaymentService');

class MovementPaymentController {
    /**
     * @param {Object} params
     * @param {IMovementPaymentService} params.movementPaymentService Serviço de pagamentos
     */
    constructor({ movementPaymentService }) {
        this.service = movementPaymentService;
    }

    /**
     * Lista pagamentos
     */
    async index(req, res, next) {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;
            
            logger.info('Controller: Listando pagamentos', { 
                page, 
                limit, 
                filters 
            });

            const result = await this.service.findAll(
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

            const result = await this.service.findById(parseInt(id));
            if (!result) {
                return res.status(404).json({ message: 'Pagamento não encontrado' });
            }

            return res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cria um novo pagamento
     */
    async store(req, res, next) {
        try {
            const data = req.body;
            
            logger.info('Controller: Criando pagamento', { data });

            const result = await this.service.create(data);
            return res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Atualiza um pagamento
     */
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const data = req.body;
            
            logger.info('Controller: Atualizando pagamento', { id, data });

            const result = await this.service.update(parseInt(id), data);
            if (!result) {
                return res.status(404).json({ message: 'Pagamento não encontrado' });
            }

            return res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Remove um pagamento
     */
    async destroy(req, res, next) {
        try {
            const { id } = req.params;
            
            logger.info('Controller: Removendo pagamento', { id });

            const result = await this.service.delete(parseInt(id));
            if (!result) {
                return res.status(404).json({ message: 'Pagamento não encontrado' });
            }

            return res.json({ message: 'Pagamento removido com sucesso' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = MovementPaymentController;
