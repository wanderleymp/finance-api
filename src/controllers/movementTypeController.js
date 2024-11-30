const PrismaMovementTypeRepository = require('../repositories/implementations/PrismaMovementTypeRepository');
const logger = require('../../config/logger');

class MovementTypeController {
    constructor() {
        this.repository = new PrismaMovementTypeRepository();
    }

    async getAllMovementTypes(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const skip = (page - 1) * limit;
            
            const result = await this.repository.getAllMovementTypes({}, parseInt(skip), parseInt(limit));
            res.json(result);
        } catch (error) {
            logger.error('Error in getAllMovementTypes:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getMovementTypeById(req, res) {
        try {
            const { id } = req.params;
            const movementType = await this.repository.getMovementTypeById(id);

            if (!movementType) {
                return res.status(404).json({ error: 'Movement type not found' });
            }

            res.json(movementType);
        } catch (error) {
            logger.error('Error in getMovementTypeById:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async createMovementType(req, res) {
        try {
            const { type_name } = req.body;

            if (!type_name) {
                return res.status(400).json({ error: 'Type name is required' });
            }

            if (type_name.length > 50) {
                return res.status(400).json({ error: 'Type name must be at most 50 characters long' });
            }

            const movementType = await this.repository.createMovementType({ type_name });
            res.status(201).json(movementType);
        } catch (error) {
            logger.error('Error in createMovementType:', error);
            if (error.message === 'Movement type with this name already exists') {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateMovementType(req, res) {
        try {
            const { id } = req.params;
            const { type_name } = req.body;

            if (!type_name) {
                return res.status(400).json({ error: 'Type name is required' });
            }

            if (type_name.length > 50) {
                return res.status(400).json({ error: 'Type name must be at most 50 characters long' });
            }

            const movementType = await this.repository.updateMovementType(id, { type_name });
            res.json(movementType);
        } catch (error) {
            logger.error('Error in updateMovementType:', error);
            if (error.message === 'Movement type with this name already exists') {
                return res.status(400).json({ error: error.message });
            }
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Movement type not found' });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async deleteMovementType(req, res) {
        try {
            const { id } = req.params;
            await this.repository.deleteMovementType(id);
            res.status(204).send();
        } catch (error) {
            logger.error('Error in deleteMovementType:', error);
            if (error.message === 'Movement type not found') {
                return res.status(404).json({ error: error.message });
            }
            if (error.message.includes('Cannot delete movement type with associated')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new MovementTypeController();
