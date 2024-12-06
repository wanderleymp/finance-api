const PrismaMovementRepository = require('../repositories/implementations/PrismaMovementRepository');
const logger = require('../../config/logger');
const { MovementError } = require('../utils/errors/MovementError');

class MovementController {
    constructor(movementRepository) {
        this.repository = movementRepository;
    }

    async createMovement(req, res) {
        try {
            const movement = await this.repository.createMovement(req.body);
            
            // Log audit trail
            await this.repository.createMovementHistory({
                movement_id: movement.movement_id,
                user_id: req.user.id,
                action: 'CREATE',
                changes: JSON.stringify(movement)
            });

            res.status(201).json(movement);
        } catch (error) {
            logger.error('Error in create movement controller:', { 
                error: error.message,
                user: req.user?.id,
                body: req.body
            });
            
            if (error instanceof MovementError) {
                return res.status(error.statusCode).json({ 
                    error: error.message,
                    details: error.details
                });
            }
            
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getMovementById(req, res) {
        try {
            const movement = await this.repository.getMovementById(req.params.id);
            res.json(movement);
        } catch (error) {
            logger.error('Error in get movement by id controller:', { 
                error: error.message,
                user: req.user?.id,
                movement_id: req.params.id
            });
            
            if (error instanceof MovementError) {
                return res.status(error.statusCode).json({ 
                    error: error.message,
                    details: error.details
                });
            }
            
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getAllMovements(req, res) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                sort_field = 'movement_date',
                sort_order = 'desc',
                ...filters 
            } = req.query;

            const skip = (page - 1) * limit;
            const movements = await this.repository.getAllMovements(
                filters,
                skip,
                parseInt(limit),
                { field: sort_field, order: sort_order }
            );

            res.json(movements);
        } catch (error) {
            logger.error('Error in get all movements controller:', { 
                error: error.message,
                user: req.user?.id,
                query: req.query
            });
            
            if (error instanceof MovementError) {
                return res.status(error.statusCode).json({ 
                    error: error.message,
                    details: error.details
                });
            }
            
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateMovement(req, res) {
        try {
            const oldMovement = await this.repository.getMovementById(req.params.id);
            const movement = await this.repository.updateMovement(req.params.id, req.body);
            
            // Log audit trail
            await this.repository.createMovementHistory({
                movement_id: movement.movement_id,
                user_id: req.user.id,
                action: 'UPDATE',
                changes: JSON.stringify({
                    before: oldMovement,
                    after: movement
                })
            });

            res.json(movement);
        } catch (error) {
            logger.error('Error in update movement controller:', { 
                error: error.message,
                user: req.user?.id,
                movement_id: req.params.id,
                body: req.body
            });
            
            if (error instanceof MovementError) {
                return res.status(error.statusCode).json({ 
                    error: error.message,
                    details: error.details
                });
            }
            
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async deleteMovement(req, res) {
        try {
            await this.repository.deleteMovement(req.params.id);
            
            // Log audit trail
            await this.repository.createMovementHistory({
                movement_id: parseInt(req.params.id),
                user_id: req.user.id,
                action: 'DELETE',
                changes: null
            });

            res.status(204).send();
        } catch (error) {
            logger.error('Error in delete movement controller:', { 
                error: error.message,
                user: req.user?.id,
                movement_id: req.params.id
            });
            
            if (error instanceof MovementError) {
                return res.status(error.statusCode).json({ 
                    error: error.message,
                    details: error.details
                });
            }
            
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getMovementHistory(req, res) {
        try {
            const history = await this.repository.getMovementHistory(req.params.id);
            res.json(history);
        } catch (error) {
            logger.error('Error in get movement history controller:', { 
                error: error.message,
                user: req.user?.id,
                movement_id: req.params.id
            });
            
            if (error instanceof MovementError) {
                return res.status(error.statusCode).json({ 
                    error: error.message,
                    details: error.details
                });
            }
            
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = MovementController;
