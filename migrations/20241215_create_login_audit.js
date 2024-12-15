const { systemDatabase } = require('../src/config/database');
const { logger } = require('../src/middlewares/logger');

async function up() {
    try {
        await systemDatabase.query(`
            CREATE TABLE IF NOT EXISTS login_audit (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                success BOOLEAN NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                attempt_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE INDEX idx_login_audit_user_id ON login_audit(user_id);
            CREATE INDEX idx_login_audit_timestamp ON login_audit(attempt_timestamp);
        `);

        logger.info('Migração da tabela login_audit concluída com sucesso');
    } catch (error) {
        logger.error('Erro na migração da tabela login_audit', { error });
        throw error;
    }
}

async function down() {
    try {
        await systemDatabase.query(`
            DROP TABLE IF EXISTS login_audit;
        `);
        logger.info('Rollback da tabela login_audit concluído com sucesso');
    } catch (error) {
        logger.error('Erro no rollback da tabela login_audit', { error });
        throw error;
    }
}

module.exports = { up, down };
