const { Pool } = require('pg');
const BaseRepository = require('../../repositories/base/BaseRepository');

class InvoiceEventRepository extends BaseRepository {
    constructor() {
        super();
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });
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

    async createWithClient(client, data) {
        try {
            const result = await client.query(
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
            throw new Error(`Erro ao criar evento de invoice: ${error.message}`);
        }
    }
}

module.exports = InvoiceEventRepository;
