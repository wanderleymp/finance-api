const { systemDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');

class LoginAudit {
    static async create(data) {
        try {
            const query = `
                INSERT INTO login_audit 
                (user_id, success, ip_address, user_agent, attempt_timestamp) 
                VALUES ($1, $2, $3, $4, NOW())
                RETURNING *
            `;
            const values = [data.userId, data.success, data.ipAddress, data.userAgent];
            const result = await systemDatabase.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao registrar auditoria de login', { error });
            throw error;
        }
    }

    static async getFailedAttempts(userId, minutes) {
        try {
            const query = `
                SELECT COUNT(*) 
                FROM login_audit 
                WHERE user_id = $1 
                AND success = false 
                AND attempt_timestamp > NOW() - INTERVAL '${minutes} minutes'
            `;
            const result = await systemDatabase.query(query, [userId]);
            return parseInt(result.rows[0].count);
        } catch (error) {
            logger.error('Erro ao buscar tentativas falhas de login', { error });
            throw error;
        }
    }
}

module.exports = LoginAudit;
