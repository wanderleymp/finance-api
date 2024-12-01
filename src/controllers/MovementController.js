const MovementService = require('../services/MovementService');
const logger = require('../../config/logger');

class MovementController {
    async createMovement(req, res) {
        try {
            const userId = req.user.id;
            const movement = await MovementService.createMovement(req.body, userId);
            res.status(201).json(movement);
        } catch (error) {
            logger.error('Error in createMovement:', error);
            if (error.message.includes('required')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getMovementById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            
            const movement = await MovementService.getMovementById(id, userId);
            res.json(movement);
        } catch (error) {
            logger.error('Error in getMovementById:', error);
            if (error.message === 'Movement not found') {
                return res.status(404).json({ error: 'Movement not found' });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getAllMovements(req, res) {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;
            const userId = req.user.id;
            
            const result = await MovementService.getAllMovements(
                filters,
                parseInt(page),
                parseInt(limit),
                userId
            );
            
            res.json(result);
        } catch (error) {
            logger.error('Error in getAllMovements:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateMovement(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            
            const movement = await MovementService.updateMovement(id, req.body, userId);
            res.json(movement);
        } catch (error) {
            logger.error('Error in updateMovement:', error);
            if (error.message === 'Movement not found') {
                return res.status(404).json({ error: 'Movement not found' });
            }
            if (error.message.includes('must be greater than')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async deleteMovement(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            
            await MovementService.deleteMovement(id, userId);
            res.status(204).send();
        } catch (error) {
            logger.error('Error in deleteMovement:', error);
            if (error.message === 'Movement not found') {
                return res.status(404).json({ error: 'Movement not found' });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new MovementController();
