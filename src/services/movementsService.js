const MovementRepository = require('../repositories/movementRepository');
const MovementPaymentsService = require('./movementPaymentsService');
const { logger } = require('../middlewares/logger');
const { systemDatabase } = require('../config/database');

class MovementsService {
    static async create(movementData) {
        const client = systemDatabase.pool;
        
        try {
            // 1. Iniciar transação 
            await client.query('BEGIN');

            // 2. Criar movimento usando o repositório
            const movement = await MovementRepository.create(movementData);

            // 3. Verificar se existe método de pagamento
            if (movementData.payment_method_id) {
                const movementPaymentService = new MovementPaymentsService();

                // Log de debug nível 2
                logger.debug('Preparando para criar pagamento de movimento', {
                    movementData,
                    movementCreated: JSON.stringify(movement),
                    paymentMethodId: movementData.payment_method_id
                });

                // Chamar movement payments para processar
                await movementPaymentService.createFromMovement(
                    { 
                        ...movement, 
                        payment_method_id: movementData.payment_method_id 
                    }, 
                    client
                );
            }

            // 4. Commit da transação
            await client.query('COMMIT');

            logger.info('Movimento criado com sucesso', { 
                movementId: movement.movement_id 
            });

            return movement;
        } catch (error) {
            // Rollback em caso de erro
            await client.query('ROLLBACK');
            
            logger.error('Erro ao criar movimento', {
                movementData,
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    static async list(filters = {}, page = 1, limit = 10) {
        return MovementRepository.findAll(page, limit, filters);
    }

    static async findById(id) {
        return MovementRepository.findById(id);
    }

    static async update(id, updateData) {
        try {
            logger.info('Atualizando movimento', { id, data: updateData });

            const movement = await MovementRepository.update(id, updateData);

            logger.info('Movimento atualizado com sucesso', { 
                movementId: movement.movement_id 
            });

            return movement;
        } catch (error) {
            logger.error('Erro ao atualizar movimento', {
                errorMessage: error.message,
                errorStack: error.stack,
                id
            });
            throw error;
        }
    }

    static async delete(id) {
        try {
            logger.info('Deletando movimento', { id });

            const result = await MovementRepository.delete(id);

            if (result.rowCount === 0) {
                const error = new Error('Movimento não encontrado');
                error.status = 404;
                throw error;
            }

            logger.info('Movimento deletado com sucesso', { movementId: id });

            return true;
        } catch (error) {
            logger.error('Erro ao deletar movimento', {
                errorMessage: error.message,
                errorStack: error.stack,
                id
            });
            throw error;
        }
    }

    static async getMovementPayments(movementId, page = 1, limit = 10, filters = {}) {
        const movementPaymentsService = new MovementPaymentsService();
        
        const result = await movementPaymentsService.list(page, limit, {
            ...filters,
            movement_id: movementId
        });
        
        logger.info('Buscando payments de movimento', {
            movementId,
            totalPayments: result.meta.total
        });
        
        return result;
    }
}

module.exports = MovementsService;
