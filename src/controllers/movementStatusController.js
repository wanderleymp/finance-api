const logger = require('../../config/logger');
const PrismaMovementStatusRepository = require('../repositories/implementations/PrismaMovementStatusRepository');

class MovementStatusController {
    constructor() {
        this.repository = new PrismaMovementStatusRepository();
    }

    async listMovementStatuses(req, res) {
        try {
            logger.info('[Controller] Listing movement statuses');
            const { skip, take, ...filters } = req.query;

            const skipValue = parseInt(skip) || 0;
            const takeValue = parseInt(take) || 10;

            const result = await this.repository.getAllMovementStatuses(filters, skipValue, takeValue);
            
            logger.info(`[Controller] Successfully retrieved ${result.data.length} movement statuses`);
            return res.json(result);
        } catch (error) {
            logger.error('[Controller] Error listing movement statuses:', error);
            return res.status(500).json({ error: 'Internal server error while listing movement statuses' });
        }
    }

    async getMovementStatusById(req, res) {
        try {
            const { id } = req.params;
            logger.info(`[Controller] Getting movement status by ID: ${id}`);

            const movementStatus = await this.repository.getMovementStatusById(id);
            
            if (!movementStatus) {
                logger.warn(`[Controller] Movement status ${id} not found`);
                return res.status(404).json({ error: 'Movement status not found' });
            }

            logger.info(`[Controller] Successfully retrieved movement status ${id}`);
            return res.json(movementStatus);
        } catch (error) {
            logger.error(`[Controller] Error getting movement status ${req.params.id}:`, error);
            return res.status(500).json({ error: 'Internal server error while getting movement status' });
        }
    }

    async getMovementStatusesByType(req, res) {
        try {
            const { typeId } = req.params;
            logger.info(`[Controller] Getting movement statuses for type: ${typeId}`);

            const movementStatuses = await this.repository.getMovementStatusesByType(typeId);
            
            logger.info(`[Controller] Successfully retrieved ${movementStatuses.length} statuses for type ${typeId}`);
            return res.json(movementStatuses);
        } catch (error) {
            logger.error(`[Controller] Error getting movement statuses for type ${req.params.typeId}:`, error);
            return res.status(500).json({ error: 'Internal server error while getting movement statuses by type' });
        }
    }

    async createMovementStatus(req, res) {
        try {
            logger.info('[Controller] Creating new movement status');
            const movementStatusData = req.body;

            // Validação básica dos campos obrigatórios
            const requiredFields = ['status_name', 'movement_type_id', 'status_category_id'];
            const missingFields = requiredFields.filter(field => !movementStatusData[field]);

            if (missingFields.length > 0) {
                logger.warn(`[Controller] Missing required fields: ${missingFields.join(', ')}`);
                return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
            }

            const movementStatus = await this.repository.createMovementStatus(movementStatusData);
            
            logger.info(`[Controller] Movement status created successfully with ID: ${movementStatus.movement_status_id}`);
            return res.status(201).json(movementStatus);
        } catch (error) {
            logger.error('[Controller] Error creating movement status:', error);

            if (error.message.includes('already exists')) {
                return res.status(409).json({ error: error.message });
            }
            if (error.message.includes('not found')) {
                return res.status(404).json({ error: error.message });
            }

            return res.status(500).json({ error: 'Internal server error while creating movement status' });
        }
    }

    async updateMovementStatus(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            logger.info(`[Controller] Updating movement status ${id}`);

            // Verificar se há dados para atualizar
            if (Object.keys(updateData).length === 0) {
                logger.warn('[Controller] No data provided for update');
                return res.status(400).json({ error: 'No data provided for update' });
            }

            const movementStatus = await this.repository.updateMovementStatus(id, updateData);
            
            logger.info(`[Controller] Movement status ${id} updated successfully`);
            return res.json(movementStatus);
        } catch (error) {
            logger.error(`[Controller] Error updating movement status ${req.params.id}:`, error);

            if (error.message.includes('not found')) {
                return res.status(404).json({ error: error.message });
            }
            if (error.message.includes('already exists')) {
                return res.status(409).json({ error: error.message });
            }

            return res.status(500).json({ error: 'Internal server error while updating movement status' });
        }
    }

    async deleteMovementStatus(req, res) {
        try {
            const { id } = req.params;
            logger.info(`[Controller] Deleting movement status ${id}`);

            await this.repository.deleteMovementStatus(id);
            
            logger.info(`[Controller] Movement status ${id} deleted successfully`);
            return res.status(204).send();
        } catch (error) {
            logger.error(`[Controller] Error deleting movement status ${req.params.id}:`, error);

            if (error.message.includes('not found')) {
                return res.status(404).json({ error: error.message });
            }
            if (error.message.includes('associated movements')) {
                return res.status(409).json({ error: error.message });
            }

            return res.status(500).json({ error: 'Internal server error while deleting movement status' });
        }
    }
}

module.exports = MovementStatusController;
