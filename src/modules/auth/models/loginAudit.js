const { systemDatabase } = require('../../../config/database');
const logger = require('../../../middlewares/logger');

class LoginAudit {
    static async create({ username, success, ip, userAgent }) {
        try {
            await systemDatabase.query(
                `INSERT INTO login_audit 
                (username, success, ip_address, user_agent, created_at)
                VALUES ($1, $2, $3, $4, NOW())`,
                [username, success, ip, userAgent]
            );
        } catch (error) {
            logger.error('Error registering login audit', { error });
            throw error;
        }
    }

    static async getFailedAttempts(username, minutes) {
        try {
            const result = await systemDatabase.query(
                `SELECT COUNT(*) 
                FROM login_audit 
                WHERE username = $1 
                AND success = false 
                AND created_at > NOW() - INTERVAL '${minutes} minutes'`,
                [username]
            );
            return parseInt(result.rows[0].count);
        } catch (error) {
            logger.error('Error getting failed login attempts', { error });
            throw error;
        }
    }
}

module.exports = LoginAudit;
