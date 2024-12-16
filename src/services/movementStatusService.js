const movementStatusRepository = require('../repositories/movementStatusRepository');
const { logger } = require('../middlewares/logger');

class MovementStatusService {
    async listMovementStatuses(page, limit, filters) {
        try {
            logger.info('Iniciando listagem de status de movimentação', {
                page,
                limit,
                filters
            });

            const result = await movementStatusRepository.findAll(filters, page, limit);

            logger.info('Listagem de status de movimentação concluída', { 
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
            logger.error('Erro na listagem de status de movimentação', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async getMovementStatusById(movementStatusId) {
        try {
            logger.info('Buscando status de movimentação por ID', { movementStatusId });
            
            const movementStatus = await movementStatusRepository.findById(movementStatusId);
            
            if (!movementStatus) {
                const error = new Error('Status de movimentação não encontrado');
                error.status = 404;
                throw error;
            }

            return movementStatus;
        } catch (error) {
            logger.error('Erro ao buscar status de movimentação', {
                errorMessage: error.message,
                errorStack: error.stack,
                movementStatusId
            });
            throw error;
        }
    }

    async createMovementStatus(movementStatusData) {
        try {
            logger.info('Criando novo status de movimentação', { movementStatusData });
            
            // Verificar se já existe um status de movimentação com o mesmo nome
            const existingMovementStatus = await this.findMovementStatusByName(movementStatusData.status_name);
            
            if (existingMovementStatus) {
                const error = new Error('Já existe um status de movimentação com este nome');
                error.status = 409;
                throw error;
            }

            const newMovementStatus = await movementStatusRepository.create(movementStatusData);
            
            logger.info('Status de movimentação criado com sucesso', { 
                movementStatusId: newMovementStatus.movement_status_id 
            });

            return newMovementStatus;
        } catch (error) {
            logger.error('Erro ao criar status de movimentação', {
                errorMessage: error.message,
                errorStack: error.stack,
                movementStatusData
            });
            throw error;
        }
    }

    async findMovementStatusByName(statusName) {
        try {
            const query = 'SELECT * FROM movement_statuses WHERE status_name = $1';
            const result = await movementStatusRepository.pool.query(query, [statusName]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar status de movimentação por nome', {
                errorMessage: error.message,
                statusName
            });
            throw error;
        }
    }

    async updateMovementStatus(movementStatusId, movementStatusData) {
        try {
            logger.info('Atualizando status de movimentação', { 
                movementStatusId, 
                movementStatusData 
            });

            const existingMovementStatus = await this.getMovementStatusById(movementStatusId);

            const updatedMovementStatus = await movementStatusRepository.update(
                movementStatusId, 
                movementStatusData
            );

            logger.info('Status de movimentação atualizado com sucesso', { 
                movementStatusId: updatedMovementStatus.movement_status_id 
            });

            return updatedMovementStatus;
        } catch (error) {
            logger.error('Erro ao atualizar status de movimentação', {
                errorMessage: error.message,
                errorStack: error.stack,
                movementStatusId,
                movementStatusData
            });
            throw error;
        }
    }

    async deleteMovementStatus(movementStatusId) {
        try {
            logger.info('Excluindo status de movimentação', { movementStatusId });

            const existingMovementStatus = await this.getMovementStatusById(movementStatusId);

            const deletedMovementStatus = await movementStatusRepository.delete(movementStatusId);

            logger.info('Status de movimentação excluído com sucesso', { 
                movementStatusId: deletedMovementStatus.movement_status_id 
            });

            return deletedMovementStatus;
        } catch (error) {
            logger.error('Erro ao excluir status de movimentação', {
                errorMessage: error.message,
                errorStack: error.stack,
                movementStatusId
            });
            throw error;
        }
    }
}

module.exports = new MovementStatusService();
