const movementRepository = require('../repositories/movementRepository');
const MovementPaymentsService = require('./movementPaymentsService');
const { logger } = require('../middlewares/logger');
const { validateSchema } = require('../utils/schemaValidator');
const movementSchema = require('../schemas/movementSchema');
const PaginationHelper = require('../utils/paginationHelper');

class MovementService {
    constructor() {
        this.movementPaymentsService = new MovementPaymentsService();
    }

    async findAll(page, limit, filters = {}) {
        try {
            const { page: validPage, limit: validLimit } = PaginationHelper.validateParams(page, limit);

            // Validar e normalizar filtros
            const normalizedFilters = {};
            
            // Mapeamento de filtros permitidos
            const allowedFilters = [
                'movement_status_id', 
                'movement_type_id', 
                'person_id', 
                'start_date', 
                'end_date', 
                'search', 
                'order_by'
            ];

            allowedFilters.forEach(key => {
                if (filters[key] !== undefined) {
                    normalizedFilters[key] = filters[key];
                }
            });

            // Buscar movimentações no repositório
            const result = await movementRepository.findAll(
                validPage, 
                validLimit, 
                normalizedFilters
            );

            logger.debug('Resultado do findAll no repositório', {
                resultType: typeof result,
                resultKeys: Object.keys(result),
                data: result.data,
                meta: result.meta
            });

            return {
                movements: result.data,
                pagination: result.meta
            };
        } catch (error) {
            logger.error('Erro no serviço de movimentações', { 
                error: error.message, 
                stack: error.stack,
                filters 
            });
            throw error;
        }
    }

    async findById(movementId) {
        try {
            await validateSchema(movementSchema.getMovementById, { id: movementId });
            const movement = await movementRepository.findById(movementId);
            
            if (!movement) {
                const error = new Error('Movimentação não encontrada');
                error.statusCode = 404;
                throw error;
            }
            
            return movement;
        } catch (error) {
            logger.error('Erro ao buscar movimentação por ID', { 
                error: error.message,
                movementId
            });
            throw error;
        }
    }

    async create(movementData) {
        try {
            await validateSchema(movementSchema.createMovement, movementData);
            
            const newMovement = await movementRepository.create(movementData);
            logger.info('Movimentação criada com sucesso', { 
                movementId: newMovement.movement_id 
            });
            
            return newMovement;
        } catch (error) {
            logger.error('Erro ao criar movimentação', { 
                error: error.message,
                movementData
            });
            throw error;
        }
    }

    async update(movementId, movementData) {
        try {
            await validateSchema(movementSchema.getMovementById, { id: movementId });
            await validateSchema(movementSchema.updateMovement, movementData);
            
            const existingMovement = await movementRepository.findById(movementId);
            
            if (!existingMovement) {
                const error = new Error('Movimentação não encontrada');
                error.statusCode = 404;
                throw error;
            }
            
            const updatedMovement = await movementRepository.update(movementId, movementData);
            logger.info('Movimentação atualizada com sucesso', { 
                movementId: updatedMovement.movement_id 
            });
            
            return updatedMovement;
        } catch (error) {
            logger.error('Erro ao atualizar movimentação', { 
                error: error.message,
                movementId,
                movementData
            });
            throw error;
        }
    }

    async delete(movementId) {
        try {
            await validateSchema(movementSchema.getMovementById, { id: movementId });
            
            const existingMovement = await movementRepository.findById(movementId);
            
            if (!existingMovement) {
                const error = new Error('Movimentação não encontrada');
                error.statusCode = 404;
                throw error;
            }
            
            const deletedMovement = await movementRepository.delete(movementId);
            logger.info('Movimentação excluída com sucesso', { 
                movementId: deletedMovement.movement_id 
            });
            
            return deletedMovement;
        } catch (error) {
            logger.error('Erro ao excluir movimentação', { 
                error: error.message,
                movementId
            });
            throw error;
        }
    }

    async getMovementPayments(movementId, page = 1, limit = 10, filters = {}) {
        try {
            // Validar se o movimento existe
            await this.findById(movementId);

            // Buscar pagamentos do movimento
            const result = await this.movementPaymentsService.list(page, limit, { 
                movement_id: movementId,
                ...filters
            });

            return result;
        } catch (error) {
            logger.error('Erro ao buscar pagamentos do movimento', { 
                error: error.message,
                movementId,
                filters
            });
            throw error;
        }
    }
}

module.exports = new MovementService();
