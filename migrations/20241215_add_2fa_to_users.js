const { systemDatabase } = require('../src/config/database');
const { logger } = require('../src/middlewares/logger');

async function up() {
    try {
        await systemDatabase.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS enable_2fa BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
            ADD COLUMN IF NOT EXISTS two_factor_secret_temp TEXT,
            ADD COLUMN IF NOT EXISTS refresh_token TEXT;

            -- Índice para busca por refresh token
            CREATE INDEX IF NOT EXISTS idx_users_refresh_token ON users(refresh_token);
        `);

        logger.info('Migração 2FA na tabela users concluída com sucesso');
    } catch (error) {
        logger.error('Erro na migração 2FA da tabela users', { error });
        throw error;
    }
}

async function down() {
    try {
        await systemDatabase.query(`
            ALTER TABLE users
            DROP COLUMN IF EXISTS enable_2fa,
            DROP COLUMN IF EXISTS two_factor_secret,
            DROP COLUMN IF EXISTS two_factor_secret_temp,
            DROP COLUMN IF EXISTS refresh_token;

            DROP INDEX IF EXISTS idx_users_refresh_token;
        `);
        logger.info('Rollback da migração 2FA na tabela users concluído com sucesso');
    } catch (error) {
        logger.error('Erro no rollback da migração 2FA na tabela users', { error });
        throw error;
    }
}

module.exports = { up, down };
