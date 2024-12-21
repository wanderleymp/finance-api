const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');

class MovementPaymentRepository extends BaseRepository {
    constructor() {
        super('movement_payments', 'payment_id');
    }

    /**
     * Busca pagamentos de um movimento
     */
    async findByMovementId(movementId) {
        try {
            const query = `
                SELECT 
                    mp.*
                FROM movement_payments mp
                WHERE mp.movement_id = $1
                ORDER BY mp.payment_date
            `;

            const { rows } = await this.pool.query(query, [movementId]);
            return rows;
        } catch (error) {
            logger.error('Erro ao buscar pagamentos do movimento', {
                error: error.message,
                movementId
            });
            throw error;
        }
    }
}

module.exports = MovementPaymentRepository;
