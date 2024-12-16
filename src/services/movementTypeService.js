const movementTypeRepository = require('../repositories/movementTypeRepository');
const { logger } = require('../middlewares/logger');

class MovementTypeService {
    async listMovementTypes(page, limit, filters) {
        try {
            logger.info('Iniciando listagem de tipos de movimentação', {
                page,
                limit,
                filters
            });

            const result = await movementTypeRepository.findAll(filters, page, limit);

            logger.info('Listagem de tipos de movimentação concluída', { 
                count: result.data.length,
                total: result.total
            });

            return {
                data: result.data,
                meta: {
                    current_page: page,
                    total: result.total,
                    per_page: limit
                }
            };
        } catch (error) {
            logger.error('Erro na listagem de tipos de movimentação', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async getMovementTypeById(movementTypeId) {
        try {
            logger.info('Buscando tipo de movimentação por ID', { movementTypeId });
            
            const movementType = await movementTypeRepository.findById(movementTypeId);
            
            if (!movementType) {
                const error = new Error('Tipo de movimentação não encontrado');
                error.status = 404;
                throw error;
            }

            return movementType;
        } catch (error) {
            logger.error('Erro ao buscar tipo de movimentação', {
                errorMessage: error.message,
                errorStack: error.stack,
                movementTypeId
            });
            throw error;
        }
    }

    async createMovementType(movementTypeData) {
        try {
            logger.info('Criando novo tipo de movimentação', { movementTypeData });
            
            const newMovementType = await movementTypeRepository.create(movementTypeData);
            
            logger.info('Tipo de movimentação criado com sucesso', { 
                movementTypeId: newMovementType.movement_type_id 
            });

            return newMovementType;
        } catch (error) {
            logger.error('Erro ao criar tipo de movimentação', {
                errorMessage: error.message,
                errorStack: error.stack,
                movementTypeData
            });
            throw error;
        }
    }

    async updateMovementType(movementTypeId, movementTypeData) {
        try {
            logger.info('Atualizando tipo de movimentação', { 
                movementTypeId, 
                movementTypeData 
            });

            const existingMovementType = await this.getMovementTypeById(movementTypeId);

            const updatedMovementType = await movementTypeRepository.update(
                movementTypeId, 
                movementTypeData
            );

            logger.info('Tipo de movimentação atualizado com sucesso', { 
                movementTypeId: updatedMovementType.movement_type_id 
            });

            return updatedMovementType;
        } catch (error) {
            logger.error('Erro ao atualizar tipo de movimentação', {
                errorMessage: error.message,
                errorStack: error.stack,
                movementTypeId,
                movementTypeData
            });
            throw error;
        }
    }

    async deleteMovementType(movementTypeId) {
        try {
            logger.info('Excluindo tipo de movimentação', { movementTypeId });

            const existingMovementType = await this.getMovementTypeById(movementTypeId);

            const deletedMovementType = await movementTypeRepository.delete(movementTypeId);

            logger.info('Tipo de movimentação excluído com sucesso', { 
                movementTypeId: deletedMovementType.movement_type_id 
            });

            return deletedMovementType;
        } catch (error) {
            logger.error('Erro ao excluir tipo de movimentação', {
                errorMessage: error.message,
                errorStack: error.stack,
                movementTypeId
            });
            throw error;
        }
    }
}

module.exports = new MovementTypeService();
