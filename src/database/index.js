const { pool } = require('./connection');
const { checkAndRunMigrations } = require('./migrations');

async function initializeDatabase() {
    try {
        // Verifica conexão
        await pool.query('SELECT NOW()');
        console.log('🔄 Verificando conexão com o banco de dados...');
        
        // Executa verificação e aplicação de migrações
        await checkAndRunMigrations();
        
        console.log('✅ Banco de dados inicializado com sucesso');
    } catch (error) {
        console.error('❌ Erro ao inicializar banco de dados:', error);
        throw error;
    }
}

module.exports = {
    initializeDatabase,
    pool
};
