const movementRepository = require('../repositories/movementRepository');
const { logger } = require('../middlewares/logger');
const { validateSchema } = require('../utils/schemaValidator');
const movementSchema = require('../schemas/movementSchema');
const PaginationHelper = require('../utils/paginationHelper');

class MovementService {
    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            // Valida e normaliza parâmetros de paginação
            const { page: validPage, limit: validLimit } = PaginationHelper.validateParams(page, limit);

            // Valida os filtros de entrada
            await validateSchema(movementSchema.listMovements, filters);
            
            // Busca movimentações com repositório
            const result = await movementRepository.findAll(validPage, validLimit, filters);
            
            // Verifica se o resultado é válido
            if (!result || !result.data || result.total === undefined) {
                logger.error('Resultado inválido do repositório de movimentações', { result });
                throw new Error('Resultado inválido do repositório de movimentações');
            }

            // Calcula páginas
            const totalRecords = result.total;
            const lastPage = Math.ceil(totalRecords / validLimit);

            return {
                data: result.data,
                meta: {
                    total: totalRecords,
                    per_page: validLimit,
                    current_page: validPage,
                    last_page: lastPage,
                    from: (validPage - 1) * validLimit + 1,
                    to: Math.min(validPage * validLimit, totalRecords)
                }
            };
        } catch (error) {
            logger.error('Erro ao listar movimentações', { 
                error: error.message,
                filters,
                page,
                limit
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
}

module.exports = new MovementService();
