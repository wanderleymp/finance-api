const { initializeDatabase } = require('./setupDatabase');
const { logger } = require('../middlewares/logger');

async function migrate() {
    try {
        logger.info('🚀 Iniciando processo de migração');
        
        await initializeDatabase();
        
        logger.info('✅ Processo de migração concluído com sucesso');
        process.exit(0);
    } catch (error) {
        logger.error('❌ Erro no processo de migração', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
}

migrate();
