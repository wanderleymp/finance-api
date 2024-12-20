const BaseRepository = require('./base/BaseRepository');
const TransactionHelper = require('../utils/transactionHelper');
const InstallmentValidations = require('../validations/installmentValidations');
const { logger } = require('../middlewares/logger');

class InstallmentRepository extends BaseRepository {
    constructor() {
        super('installments');
    }

    /**
     * Lista parcelas com informações relacionadas
     * @param {number} page - Número da página
     * @param {number} limit - Limite de itens por página
     * @param {Object} filters - Filtros a serem aplicados
     * @param {Object} orderBy - Configuração de ordenação
     * @param {Object} [client] - Client opcional para transação
     * @returns {Promise<Object>} Lista paginada de parcelas
     */
    async findAllWithRelations(page = 1, limit = 10, filters = {}, orderBy = {}, client) {
        try {
            const { whereClause, queryParams, paramCount } = this.buildWhereClause(filters);
            const orderByClause = this.buildOrderByClause(orderBy);
            const offset = (page - 1) * limit;

            const query = `
                SELECT 
                    i.*,
                    m.description as movement_description,
                    m.type as movement_type,
                    m.status as movement_status
                FROM installments i
                LEFT JOIN movements m ON i.movement_id = m.id
                ${whereClause}
                ${orderByClause}
                LIMIT $${paramCount}
                OFFSET $${paramCount + 1}
            `;

            const countQuery = `
                SELECT COUNT(*)::integer
                FROM installments i
                LEFT JOIN movements m ON i.movement_id = m.id
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
                data: resultQuery.rows,
                pagination: {
                    page,
                    limit,
                    totalItems,
                    totalPages
                }
            };
        } catch (error) {
            logger.error('Erro ao listar parcelas com relações', {
                error: error.message,
                filters
            });
            throw error;
        }
    }

    /**
     * Busca parcela por ID com informações relacionadas
     * @param {number} id - ID da parcela
     * @param {Object} [client] - Client opcional para transação
     * @returns {Promise<Object>} Parcela encontrada
     */
    async findByIdWithRelations(id, client) {
        try {
            const query = `
                SELECT 
                    i.*,
                    m.description as movement_description,
                    m.type as movement_type,
                    m.status as movement_status
                FROM installments i
                LEFT JOIN movements m ON i.movement_id = m.id
                WHERE i.id = $1
            `;

            const result = await TransactionHelper.getClient(client)
                .query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao buscar parcela por ID com relações', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    /**
     * Atualiza o status de uma parcela
     * @param {number} id - ID da parcela
     * @param {string} status - Novo status
     * @param {Object} [client] - Client opcional para transação
     * @returns {Promise<Object>} Parcela atualizada
     */
    async updateStatus(id, status, client) {
        return TransactionHelper.executeInTransaction(async (dbClient) => {
            // Busca parcela atual
            const current = await this.findById(id, dbClient);
            if (!current) {
                throw new Error('Parcela não encontrada');
            }

            // Valida transição de status
            InstallmentValidations.validateStatusUpdate(status, current.status);

            // Atualiza status
            const updated = await this.update(id, { 
                status,
                paid_date: status === 'PAID' ? new Date() : null
            }, dbClient);

            // Se parcela foi paga, verifica se todas as parcelas foram pagas
            if (status === 'PAID') {
                const query = `
                    SELECT COUNT(*)::integer as total,
                           COUNT(*) FILTER (WHERE status = 'PAID')::integer as paid
                    FROM installments
                    WHERE movement_id = $1
                `;

                const result = await dbClient.query(query, [current.movement_id]);
                const { total, paid } = result.rows[0];

                // Se todas as parcelas foram pagas, atualiza status do movimento
                if (total === paid) {
                    const movementRepository = new BaseRepository('movements');
                    await movementRepository.update(
                        current.movement_id,
                        { status: 'PAID' },
                        dbClient
                    );
                }
            }

            return updated;
        });
    }

    /**
     * Cria parcelas para um movimento
     * @param {Object} movement - Movimento
     * @param {Object[]} installments - Array de parcelas
     * @returns {Promise<Object[]>} Parcelas criadas
     */
    async createInstallments(movement, installments) {
        // Valida parcelas
        InstallmentValidations.validateInstallments(movement, installments);

        return TransactionHelper.executeInTransaction(async (client) => {
            const installmentsWithMovementId = installments.map(installment => ({
                ...installment,
                movement_id: movement.id
            }));

            return this.createMany(installmentsWithMovementId, client);
        });
    }

    /**
     * Atualiza várias parcelas
     * @param {Object[]} installments - Array de parcelas
     * @returns {Promise<Object[]>} Parcelas atualizadas
     */
    async updateMany(installments) {
        return TransactionHelper.executeInTransaction(async (client) => {
            const results = [];

            for (const installment of installments) {
                // Valida dados
                InstallmentValidations.validateInstallmentUpdate(installment);

                // Busca parcela atual
                const current = await this.findById(installment.id, client);
                if (!current) {
                    throw new Error(`Parcela ${installment.id} não encontrada`);
                }

                // Valida transição de status se houver mudança
                if (installment.status && installment.status !== current.status) {
                    InstallmentValidations.validateStatusUpdate(
                        installment.status,
                        current.status
                    );
                }

                // Atualiza parcela
                const updated = await this.update(installment.id, installment, client);
                results.push(updated);
            }

            return results;
        });
    }

    /**
     * Busca parcelas por movimento
     * @param {number} movementId - ID do movimento
     * @param {Object} [client] - Client opcional para transação
     * @returns {Promise<Object[]>} Lista de parcelas
     */
    async findByMovementId(movementId, client) {
        try {
            const query = `
                SELECT 
                    i.*,
                    m.description as movement_description,
                    m.type as movement_type,
                    m.status as movement_status
                FROM installments i
                LEFT JOIN movements m ON i.movement_id = m.id
                WHERE i.movement_id = $1
                ORDER BY i.installment_number ASC
            `;

            const result = await TransactionHelper.getClient(client)
                .query(query, [movementId]);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar parcelas por movimento', {
                error: error.message,
                movementId
            });
            throw error;
        }
    }
}

module.exports = InstallmentRepository;
