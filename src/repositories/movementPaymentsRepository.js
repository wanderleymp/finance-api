const { logger } = require('../middlewares/logger');
const BaseRepository = require('./base/BaseRepository');

class MovementPaymentsRepository extends BaseRepository {
    constructor() {
        super('movement_payments', 'payment_id');
    }

    /**
     * Lista pagamentos com informações relacionadas
     */
    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const { whereClause, queryParams, paramCount } = this.buildWhereClause(filters);

            // Query principal com JOINs
            const query = `
                SELECT 
                    mp.*,
                    m.description as movement_description,
                    p.full_name as person_name,
                    ps.name as status_name
                FROM movement_payments mp
                LEFT JOIN movements m ON mp.movement_id = m.movement_id
                LEFT JOIN persons p ON m.person_id = p.person_id
                LEFT JOIN payment_status ps ON mp.status_id = ps.status_id
                ${whereClause}
                ORDER BY mp.payment_date DESC
                LIMIT $${paramCount}
                OFFSET $${paramCount + 1}
            `;

            // Query de contagem
            const countQuery = `
                SELECT COUNT(*)::integer
                FROM movement_payments mp
                LEFT JOIN movements m ON mp.movement_id = m.movement_id
                LEFT JOIN persons p ON m.person_id = p.person_id
                LEFT JOIN payment_status ps ON mp.status_id = ps.status_id
                ${whereClause}
            `;

            const offset = (page - 1) * limit;

            const [resultQuery, countResult] = await Promise.all([
                this.pool.query(query, [...queryParams, limit, offset]),
                this.pool.query(countQuery, queryParams)
            ]);

            const totalItems = countResult.rows[0].count;
            const totalPages = Math.ceil(totalItems / limit);

            return {
                data: resultQuery.rows,
                pagination: {
                    page,
                    limit,
                    totalItems,
                    totalPages
                }
            };
        } catch (error) {
            logger.error('Erro ao listar pagamentos', {
                error: error.message,
                filters
            });
            throw error;
        }
    }

    /**
     * Busca pagamento por ID com informações relacionadas
     */
    async findById(id) {
        try {
            const query = `
                SELECT 
                    mp.*,
                    m.description as movement_description,
                    p.full_name as person_name,
                    ps.name as status_name
                FROM movement_payments mp
                LEFT JOIN movements m ON mp.movement_id = m.movement_id
                LEFT JOIN persons p ON m.person_id = p.person_id
                LEFT JOIN payment_status ps ON mp.status_id = ps.status_id
                WHERE mp.payment_id = $1
            `;

            const result = await this.pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar pagamento por ID', {
                error: error.message,
                paymentId: id
            });
            throw error;
        }
    }

    /**
     * Busca pagamentos por movimento
     */
    async findByMovementId(movementId) {
        try {
            const query = `
                SELECT 
                    mp.*,
                    m.description as movement_description,
                    p.full_name as person_name,
                    ps.name as status_name
                FROM movement_payments mp
                LEFT JOIN movements m ON mp.movement_id = m.movement_id
                LEFT JOIN persons p ON m.person_id = p.person_id
                LEFT JOIN payment_status ps ON mp.status_id = ps.status_id
                WHERE mp.movement_id = $1
                ORDER BY mp.payment_date DESC
            `;

            const result = await this.pool.query(query, [movementId]);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar pagamentos por movimento', {
                error: error.message,
                movementId
            });
            throw error;
        }
    }

    /**
     * Atualiza status do pagamento
     */
    async updateStatus(id, statusId, client = this.pool) {
        try {
            const query = `
                UPDATE movement_payments
                SET 
                    status_id = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE payment_id = $2
                RETURNING *
            `;

            const result = await client.query(query, [statusId, id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar status do pagamento', {
                error: error.message,
                paymentId: id,
                statusId
            });
            throw error;
        }
    }
}

module.exports = MovementPaymentsRepository;
