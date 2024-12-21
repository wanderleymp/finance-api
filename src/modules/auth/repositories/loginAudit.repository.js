const { systemDatabase } = require('../../../config/database');
const { logger } = require('../../../middlewares/logger');
const ILoginAuditRepository = require('../interfaces/ILoginAuditRepository');

class LoginAuditRepository extends ILoginAuditRepository {
    constructor() {
        super();
        this.pool = systemDatabase.pool;
    }

    async create({ username, success, ip, userAgent, userId }) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            
            const result = await client.query(
                `INSERT INTO login_audit 
                (user_id, success, ip_address, user_agent)
                VALUES ($1, $2, $3, $4)
                RETURNING *`,
                [userId, success, ip, userAgent]
            );

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error registering login audit', { error });
            throw error;
        } finally {
            client.release();
        }
    }

    async getFailedAttempts(username, minutes) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                `SELECT COUNT(*) 
                FROM login_audit 
                WHERE user_id = (SELECT user_id FROM users WHERE username = $1)
                AND success = false 
                AND attempt_timestamp > NOW() - INTERVAL '${minutes} minutes'`,
                [username]
            );
            return parseInt(result.rows[0].count);
        } catch (error) {
            logger.error('Error getting failed login attempts', { error });
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = LoginAuditRepository;
