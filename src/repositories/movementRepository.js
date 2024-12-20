const BaseRepository = require('./base/BaseRepository');
const TransactionHelper = require('../utils/transactionHelper');
const MovementValidations = require('../validations/movementValidations');
const { logger } = require('../middlewares/logger');

class MovementRepository extends BaseRepository {
    constructor() {
        super('movements');
    }

    /**
     * Lista movimentos com informações relacionadas
     * @param {number} page - Número da página
     * @param {number} limit - Limite de itens por página
     * @param {Object} filters - Filtros a serem aplicados
     * @param {Object} orderBy - Configuração de ordenação
     * @param {Object} [client] - Client opcional para transação
     * @returns {Promise<Object>} Lista paginada de movimentos
     */
    async findAllDetailed(page = 1, limit = 10, filters = {}, orderBy = {}, client) {
        try {
            const { whereClause, queryParams, paramCount } = this.buildWhereClause(filters);
            const orderByClause = this.buildOrderByClause(orderBy);
            const offset = (page - 1) * limit;

            const query = `
                SELECT 
                    m.*,
                    json_agg(DISTINCT jsonb_build_object(
                        'id', p.id,
                        'value', p.value,
                        'status', p.status,
                        'payment_date', p.payment_date,
                        'payment_type', p.payment_type
                    )) FILTER (WHERE p.id IS NOT NULL) as payments,
                    json_agg(DISTINCT jsonb_build_object(
                        'id', i.id,
                        'value', i.value,
                        'status', i.status,
                        'due_date', i.due_date,
                        'installment_number', i.installment_number
                    )) FILTER (WHERE i.id IS NOT NULL) as installments
                FROM movements m
                LEFT JOIN movement_payments p ON m.id = p.movement_id
                LEFT JOIN installments i ON m.id = i.movement_id
                ${whereClause}
                GROUP BY m.id
                ${orderByClause}
                LIMIT $${paramCount}
                OFFSET $${paramCount + 1}
            `;

            const countQuery = `
                SELECT COUNT(DISTINCT m.id)::integer
                FROM movements m
                LEFT JOIN movement_payments p ON m.id = p.movement_id
                LEFT JOIN installments i ON m.id = i.movement_id
                ${whereClause}
            `;

            const dbClient = TransactionHelper.getClient(client);
            const [resultQuery, countResult] = await Promise.all([
                dbClient.query(query, [...queryParams, limit, offset]),
                dbClient.query(countQuery, queryParams)
            ]);

            const totalItems = countResult.rows[0].count;
            const totalPages = Math.ceil(totalItems / limit);

            return {
                data: resultQuery.rows.map(row => ({
                    ...row,
                    payments: row.payments || [],
                    installments: row.installments || []
                })),
                pagination: {
                    page,
                    limit,
                    totalItems,
                    totalPages
                }
            };
        } catch (error) {
            logger.error('Erro ao listar movimentos com relações', {
                error: error.message,
                filters
            });
            throw error;
        }
    }

    /**
     * Busca movimento por ID com informações relacionadas
     * @param {number} id - ID do movimento
     * @param {Object} [client] - Client opcional para transação
     * @returns {Promise<Object>} Movimento encontrado
     */
    async findByIdWithRelations(id, client) {
        try {
            const query = `
                SELECT 
                    m.*,
                    json_agg(DISTINCT jsonb_build_object(
                        'id', p.id,
                        'value', p.value,
                        'status', p.status,
                        'payment_date', p.payment_date,
                        'payment_type', p.payment_type
                    )) FILTER (WHERE p.id IS NOT NULL) as payments,
                    json_agg(DISTINCT jsonb_build_object(
                        'id', i.id,
                        'value', i.value,
                        'status', i.status,
                        'due_date', i.due_date,
                        'installment_number', i.installment_number
                    )) FILTER (WHERE i.id IS NOT NULL) as installments
                FROM movements m
                LEFT JOIN movement_payments p ON m.id = p.movement_id
                LEFT JOIN installments i ON m.id = i.movement_id
                WHERE m.id = $1
                GROUP BY m.id
            `;

            const result = await TransactionHelper.getClient(client)
                .query(query, [id]);

            if (result.rows[0]) {
                return {
                    ...result.rows[0],
                    payments: result.rows[0].payments || [],
                    installments: result.rows[0].installments || []
                };
            }

            return null;
        } catch (error) {
            logger.error('Erro ao buscar movimento por ID com relações', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    /**
     * Atualiza o status de um movimento
     * @param {number} id - ID do movimento
     * @param {string} status - Novo status
     * @param {Object} [client] - Client opcional para transação
     * @returns {Promise<Object>} Movimento atualizado
     */
    async updateStatus(id, status, client) {
        return TransactionHelper.executeInTransaction(async (dbClient) => {
            // Busca movimento atual
            const current = await this.findById(id, dbClient);
            if (!current) {
                throw new Error('Movimento não encontrado');
            }

            // Valida transição de status
            MovementValidations.validateStatusUpdate(status, current.status);

            // Atualiza status
            const updated = await this.update(id, { status }, dbClient);

            // Se movimento foi pago, atualiza status dos pagamentos
            if (status === 'PAID') {
                const paymentRepository = new BaseRepository('movement_payments');
                await paymentRepository.updateMany(
                    current.payments.map(p => ({
                        ...p,
                        status: 'PAID',
                        payment_date: new Date()
                    })),
                    dbClient
                );
            }

            return updated;
        });
    }

    /**
     * Cria um movimento com seus pagamentos
     * @param {Object} movement - Dados do movimento
     * @param {Object[]} payments - Array de pagamentos
     * @returns {Promise<Object>} Movimento criado com pagamentos
     */
    async createWithPayments(movement, payments) {
        // Valida dados
        MovementValidations.validateMovementWithPayments(movement, payments);

        return TransactionHelper.executeInTransaction(async (client) => {
            const createdMovement = await this.create(movement, client);

            const paymentsWithMovementId = payments.map(payment => ({
                ...payment,
                movement_id: createdMovement.id
            }));

            const paymentRepository = new BaseRepository('movement_payments');
            await paymentRepository.createMany(paymentsWithMovementId, client);

            return this.findByIdWithRelations(createdMovement.id, client);
        });
    }

    /**
     * Atualiza um movimento e seus pagamentos
     * @param {number} id - ID do movimento
     * @param {Object} movement - Dados do movimento
     * @param {Object[]} payments - Array de pagamentos
     * @returns {Promise<Object>} Movimento atualizado com pagamentos
     */
    async updateWithPayments(id, movement, payments) {
        // Valida dados
        MovementValidations.validateMovementWithPayments(movement, payments);

        return TransactionHelper.executeInTransaction(async (client) => {
            // Busca movimento atual
            const current = await this.findById(id, client);
            if (!current) {
                throw new Error('Movimento não encontrado');
            }

            // Valida transição de status se houver mudança
            if (movement.status && movement.status !== current.status) {
                MovementValidations.validateStatusUpdate(movement.status, current.status);
            }

            // Atualiza movimento
            await this.update(id, movement, client);

            const paymentRepository = new BaseRepository('movement_payments');

            // Remove pagamentos antigos
            await paymentRepository.deleteMany(
                current.payments.map(p => p.id),
                client
            );

            // Cria novos pagamentos
            const paymentsWithMovementId = payments.map(payment => ({
                ...payment,
                movement_id: id
            }));
            await paymentRepository.createMany(paymentsWithMovementId, client);

            return this.findByIdWithRelations(id, client);
        });
    }
}

module.exports = MovementRepository;
