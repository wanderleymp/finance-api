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
            const { page = 1, limit = 10, detailed = true, ...filters } = req.query;
            
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

    /**
     * Cria novo movimento
     */
    async create(req, res, next) {
        try {
            const data = req.body;
            
            logger.info('Controller: Criando movimento', { data });

            const movement = await this.service.create(data);

            return res.status(201).json(movement);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Atualiza movimento
     */
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const data = req.body;
            
            logger.info('Controller: Atualizando movimento', { id, data });

            const movement = await this.service.update(parseInt(id), data);

            return res.json(movement);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Remove movimento
     */
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            
            logger.info('Controller: Removendo movimento', { id });

            await this.service.delete(parseInt(id));

            return res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    /**
     * Atualiza status do movimento
     */
    async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            logger.info('Controller: Atualizando status do movimento', { id, status });

            const movement = await this.service.updateStatus(parseInt(id), status);

            return res.json(movement);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = MovementController;
