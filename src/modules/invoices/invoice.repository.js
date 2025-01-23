const { logger } = require('../../middlewares/logger');
const BaseRepository = require('../../repositories/base/BaseRepository');
const { DatabaseError, ValidationError } = require('../../utils/errors');
const IInvoiceRepository = require('./interfaces/IInvoiceRepository');

class InvoiceRepository extends BaseRepository {
    constructor() {
        super('invoices', 'invoice_id');
    }

    /**
     * Cria uma nova fatura
     * @param {Object} data - Dados da fatura
     * @returns {Promise<Object>} Fatura criada
     */
    async create(data) {
        try {
            // Validar reference_id
            if (!data.reference_id) {
                logger.error('Tentativa de criar fatura sem reference_id', { data });
                throw new ValidationError('É necessário informar um reference_id para criar a fatura', {
                    code: 'MISSING_REFERENCE_ID',
                    details: data
                });
            }

            // Log de rastreamento
            console.log('Criando Invoice', { 
                movementId: data.movement_id,
                type: data.type,
                timestamp: new Date().toISOString(),
                caller: new Error().stack.split('\n')[2]?.trim()
            });

            const fields = Object.keys(data);
            const values = Object.values(data);
            const placeholders = values.map((_, index) => `$${index + 1}`);
            
            const query = `
                INSERT INTO ${this.tableName} (${fields.join(', ')}, created_at, updated_at)
                VALUES (${placeholders}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING *
            `;
            
            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar fatura', { error, data });
            throw new DatabaseError('Erro ao criar fatura', error);
        }
    }

    /**
     * Atualiza uma fatura
     * @param {number} id - ID da fatura
     * @param {Object} data - Dados para atualização
     * @returns {Promise<Object>} Fatura atualizada
     */
    async update(id, data) {
        try {
            const fields = Object.keys(data);
            const values = Object.values(data);
            const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
            
            const query = `
                UPDATE ${this.tableName}
                SET ${setClause}, updated_at = CURRENT_TIMESTAMP
                WHERE invoice_id = $${fields.length + 1}
                RETURNING *
            `;
            
            const result = await this.pool.query(query, [...values, id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar fatura', { error, id, data });
            throw new DatabaseError('Erro ao atualizar fatura', error);
        }
    }

    /**
     * Busca faturas por reference_id
     * @param {string} referenceId - ID de referência da fatura
     * @returns {Promise<Array>} Lista de faturas
     */
    async findByReferenceId(referenceId) {
        try {
            const query = `
                SELECT * FROM ${this.tableName}
                WHERE reference_id = $1
            `;
            
            const result = await this.pool.query(query, [referenceId]);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar fatura por reference_id', { error, referenceId });
            throw new DatabaseError('Erro ao buscar fatura por reference_id', error);
        }
    }

    /**
     * Busca faturas por status
     * @param {string} status - Status da fatura
     * @param {Object} options - Opções de busca
     * @returns {Promise<Array>} Lista de faturas
     */
    async findByStatus(status, options = {}) {
        try {
            const { page = 1, limit = 10 } = options;
            const offset = (page - 1) * limit;

            const query = `
                SELECT * FROM ${this.tableName}
                WHERE status = $1
                LIMIT $2 OFFSET $3
            `;
            
            const result = await this.pool.query(query, [status, limit, offset]);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar faturas por status', { error, status, options });
            throw new DatabaseError('Erro ao buscar faturas por status', error);
        }
    }
}

module.exports = InvoiceRepository;
