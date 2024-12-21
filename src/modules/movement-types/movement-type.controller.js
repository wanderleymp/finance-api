const { Router } = require('express');
const { logger } = require('../../middlewares/logger');

class MovementTypeController {
    constructor({ movementTypeService }) {
        this.movementTypeService = movementTypeService;
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.get('/:id', this.findById.bind(this));
    }

    async findById(req, res, next) {
        try {
            const { id } = req.params;
            const type = await this.movementTypeService.findById(id);
            
            if (!type) {
                return res.status(404).json({ message: 'Tipo de movimento não encontrado' });
            }

            res.json(type);
        } catch (error) {
            logger.error('Erro ao buscar tipo de movimento por ID no controller', {
                error: error.message,
                params: req.params
            });
            next(error);
        }
    }
}

module.exports = MovementTypeController;
