const { logger } = require('../../middlewares/logger');
const BaseRepository = require('../../repositories/base/BaseRepository');

class InvoiceEventRepository extends BaseRepository {
    constructor() {
        super('invoice_events', 'event_id');
    }

    async transaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async create(data) {
        try {
            const result = await this.pool.query(
                `INSERT INTO invoice_events 
                (invoice_id, event_type, event_date, event_data, status, message) 
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [
                    data.invoice_id, 
                    data.event_type, 
                    data.event_date, 
                    data.event_data, 
                    data.status, 
                    data.message
                ]
            );
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar evento de invoice', {
                error: error.message,
                stack: error.stack,
                method: 'create'
            });
            throw new Error(`Erro ao criar evento de invoice: ${error.message}`);
        }
    }

    async findLastEventByInvoiceAndType(invoiceId, eventType) {
        try {
            logger.info('Buscando último evento', {
                invoiceId,
                eventType,
                method: 'findLastEventByInvoiceAndType'
            });

            const result = await this.pool.query(
                `SELECT * FROM invoice_events 
                WHERE invoice_id = $1 
                AND event_type = $2 
                ORDER BY event_date DESC 
                LIMIT 1`,
                [invoiceId, eventType]
            );

            logger.info('Resultado da busca de último evento', {
                invoiceId,
                eventType,
                encontrado: result.rows.length > 0,
                method: 'findLastEventByInvoiceAndType'
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar último evento', {
                invoiceId,
                eventType,
                error: error.message,
                stack: error.stack,
                method: 'findLastEventByInvoiceAndType'
            });

            throw new Error(`Erro ao buscar último evento: ${error.message}`);
        }
    }
}

module.exports = InvoiceEventRepository;
