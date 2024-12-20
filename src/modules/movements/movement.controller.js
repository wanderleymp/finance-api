const { logger } = require('../../middlewares/logger');
const IMovementService = require('./interfaces/IMovementService');

class MovementController {
    /**
     * @param {Object} params
     * @param {IMovementService} params.movementService Serviço de movimentos
     */
    constructor({ movementService }) {
        this.service = movementService;
    }

    /**
     * Lista movimentos
     */
    async index(req, res, next) {
        try {
            const { page, limit, detailed = true, ...filters } = req.query;
            
            logger.info('Controller: Listando movimentos', { 
                page, 
                limit,
                detailed,
                filters 
            });

            const result = await this.service.findAll(
                parseInt(page), 
                parseInt(limit), 
                filters,
                detailed === 'true'
            );

            return res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Busca movimento por ID
     */
    async show(req, res, next) {
        try {
            const { id } = req.params;
            
            logger.info('Controller: Buscando movimento por ID', { id });

            const movement = await this.service.getMovementById(parseInt(id));

            return res.json(movement);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = MovementController;
