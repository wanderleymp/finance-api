const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');

class InstallmentRepository extends BaseRepository {
    constructor() {
        super('installments', 'installment_id');
    }

    /**
     * Busca parcelas de um movimento
     */
    async findByMovementId(movementId) {
        try {
            const query = `
                SELECT 
                    i.*
                FROM installments i
                WHERE i.movement_id = $1
                ORDER BY i.installment_number
            `;

            const { rows } = await this.pool.query(query, [movementId]);
            return rows;
        } catch (error) {
            logger.error('Erro ao buscar parcelas do movimento', {
                error: error.message,
                movementId
            });
            throw error;
        }
    }
}

module.exports = InstallmentRepository;
