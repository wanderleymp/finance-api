const MovementRepository = require('../repositories/movementRepository');
const MovementPaymentsService = require('./movementPaymentsService');
const { logger } = require('../middlewares/logger');
const { systemDatabase } = require('../config/database');

class MovementsService {
    constructor() {
        this.repository = MovementRepository;
    }

    async create(movementData) {
        const client = systemDatabase.pool;
        
        try {
            // 1. Iniciar transação 
            await client.query('BEGIN');

            // 2. Criar movimento usando o repositório
            const movement = await this.repository.create(movementData);

            // 3. Verificar se existe método de pagamento
            if (movementData.payment_method_id) {
                const movementPaymentService = new MovementPaymentsService();

                // Chamar movement payments para processar
                await movementPaymentService.createFromMovement(movement, client);
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

    async list(filters = {}, page = 1, limit = 10) {
        return this.repository.findAll(page, limit, filters);
    }

    async getById(id) {
        return this.repository.findById(id);
    }

    async update(id, updateData) {
        try {
            logger.info('Atualizando movimento', { id, data: updateData });

            const movement = await this.repository.update(id, updateData);

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

    async delete(id) {
        try {
            logger.info('Deletando movimento', { id });

            const result = await this.repository.delete(id);

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
