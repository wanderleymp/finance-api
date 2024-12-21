const { logger } = require('../../middlewares/logger');

class MovementTypeService {
    constructor({ movementTypeRepository }) {
        this.movementTypeRepository = movementTypeRepository;
    }

    async findById(id) {
        try {
            return await this.movementTypeRepository.findById(id);
        } catch (error) {
            logger.error('Erro ao buscar tipo de movimento por ID', {
                error: error.message,
                id
            });
            throw error;
        }
    }
}

module.exports = MovementTypeService;
