const { logger } = require('../../middlewares/logger');
const BaseRepository = require('../../repositories/base/BaseRepository');
const IInvoiceEventRepository = require('./interfaces/IInvoiceEventRepository');
const { DatabaseError } = require('../../utils/errors');

class InvoiceEventRepository extends BaseRepository {
    constructor() {
        super('invoice_events', 'event_id');
    }

    /**
     * Busca eventos por ID de invoice
     * @param {number} invoiceId - ID da invoice
     * @returns {Promise<Array>} Lista de eventos
     */
    async findByInvoiceId(invoiceId) {
        try {
            const query = `
                SELECT * FROM ${this.tableName}
                WHERE invoice_id = $1
                ORDER BY event_date DESC
            `;
            
            const result = await this.pool.query(query, [invoiceId]);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar eventos por invoice ID', { error, invoiceId });
            throw new DatabaseError('Erro ao buscar eventos por invoice ID', error);
        }
    }

    /**
     * Busca eventos por tipo de evento
     * @param {string} eventType - Tipo do evento
     * @param {Object} options - Opções de busca
     * @returns {Promise<Array>} Lista de eventos
     */
    async findByEventType(eventType, options = {}) {
        try {
            const { page = 1, limit = 10 } = options;
            const offset = (page - 1) * limit;

            const query = `
                SELECT * FROM ${this.tableName}
                WHERE event_type = $1
                ORDER BY event_date DESC
                LIMIT $2 OFFSET $3
            `;
            
            const result = await this.pool.query(query, [eventType, limit, offset]);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar eventos por tipo', { error, eventType });
            throw new DatabaseError('Erro ao buscar eventos por tipo', error);
        }
    }
}

module.exports = InvoiceEventRepository;
