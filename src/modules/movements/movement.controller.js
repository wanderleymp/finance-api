const { logger } = require('../../middlewares/logger');
const { createMovementSchema } = require('./validators/movement.validator');
const { ValidationError } = require('../../utils/errors');

class MovementController {
    constructor({ movementService }) {
        this.service = movementService;
    }

    async index(req, res) {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;
            
            logger.info('Controller: Listando movimentos', { 
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
            logger.error('Controller: Erro ao listar movimentos', {
                error: error.message,
                error_stack: error.stack,
                query: req.query
            });
            return res.status(500).json({
                success: false,
                error: 'Erro interno no servidor'
            });
        }
    }

    async show(req, res) {
        try {
            const id = parseInt(req.params.id);
            const detailed = req.query.detailed === 'true';

            logger.info('Controller: Buscando movimento por ID', {
                id,
                detailed
            });

            const result = await this.service.getMovementById(id, detailed);
            return res.json(result);
        } catch (error) {
            logger.error('Controller: Erro ao buscar movimento', {
                error: error.message,
                error_stack: error.stack,
                id: req.params.id
            });
            return res.status(500).json({
                success: false,
                error: 'Erro interno no servidor'
            });
        }
    }

    async create(req, res) {
        try {
            logger.info('Controller: Criando movimento', { data: req.body });

            // Validar e aplicar defaults
            const { value, error } = createMovementSchema.validate(req.body, { 
                abortEarly: false,
                stripUnknown: true
            });

            if (error) {
                throw new ValidationError('Erro de validação', error.details);
            }

            const result = await this.service.create(value);
            return res.json(result);
        } catch (error) {
            logger.error('Controller: Erro ao criar movimento', {
                error: error.message,
                error_stack: error.stack,
                data: req.body
            });

            if (error instanceof ValidationError) {
                return res.status(400).json({
                    success: false,
                    error: error.message,
                    details: error.details
                });
            }

            return res.status(500).json({
                success: false,
                error: 'Erro interno no servidor'
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            
            logger.info('Controller: Atualizando movimento', { id, data });

            const movement = await this.service.update(parseInt(id), data);
            return res.json(movement);
        } catch (error) {
            logger.error('Controller: Erro ao atualizar movimento', {
                error: error.message,
                error_stack: error.stack,
                id: req.params.id,
                data: req.body
            });
            return res.status(500).json({
                success: false,
                error: 'Erro interno no servidor'
            });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            
            logger.info('Controller: Removendo movimento', { id });

            await this.service.delete(parseInt(id));
            return res.status(204).send();
        } catch (error) {
            logger.error('Controller: Erro ao remover movimento', {
                error: error.message,
                error_stack: error.stack,
                id: req.params.id
            });
            return res.status(500).json({
                success: false,
                error: 'Erro interno no servidor'
            });
        }
    }

    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            logger.info('Controller: Atualizando status do movimento', { id, status });

            const movement = await this.service.updateStatus(parseInt(id), status);
            return res.json(movement);
        } catch (error) {
            logger.error('Controller: Erro ao atualizar status do movimento', {
                error: error.message,
                error_stack: error.stack,
                id: req.params.id,
                status: req.body.status
            });
            return res.status(500).json({
                success: false,
                error: 'Erro interno no servidor'
            });
        }
    }
}

module.exports = MovementController;
