const fs = require('fs');
const path = require('path');

/**
 * Creates a backup of the database
 * @param {Object} client - Database client
 * @param {string} backupPath - Path to store backup
 * @param {string} database - Database name
 */
async function createDatabaseBackup(client, backupPath, database) {
    try {
        console.log('📦 Iniciando backup do banco de dados...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupPath, `${database}_${timestamp}.sql`);
        
        const tables = await client.query(`
            SELECT tablename 
            FROM pg_catalog.pg_tables 
            WHERE schemaname = 'public'
        `);
        
        console.log(`📊 Encontradas ${tables.rows.length} tabelas para backup`);
        
        let backupContent = '';
        for (const table of tables.rows) {
            console.log(`  ↳ Fazendo backup da tabela: ${table.tablename}`);
            const result = await client.query(`SELECT * FROM ${table.tablename}`);
            if (result.rows.length > 0) {
                backupContent += `-- Backup da tabela ${table.tablename}\n`;
                backupContent += `COPY ${table.tablename} FROM stdin;\n`;
                result.rows.forEach(row => {
                    backupContent += JSON.stringify(row) + '\n';
                });
                backupContent += '\\.\n\n';
            }
        }
        
        fs.writeFileSync(backupFile, backupContent);
        console.log(`✅ Backup concluído: ${backupFile}`);
        return backupFile;
    } catch (error) {
        console.error('❌ Erro durante backup:', error);
        throw error;
    }
}

/**
 * Sets up the database with required tables
 * @param {Object} client - Database client
 */
async function setupDatabase(client) {
    try {
        console.log('🔧 Verificando tabelas do sistema...');
        
        // Verifica e cria tabela migrations se não existir
        const hasMigrations = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'migrations'
            );
        `);
        
        if (!hasMigrations.rows[0].exists) {
            console.log('📝 Criando tabela migrations...');
            await client.query(`
                CREATE TABLE migrations (
                    id SERIAL PRIMARY KEY,
                    migration_name VARCHAR(255) NOT NULL,
                    db_version VARCHAR(50) NOT NULL,
                    database_name VARCHAR(100) NOT NULL,
                    description TEXT,
                    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX idx_migrations_name ON migrations(migration_name);
            `);
            console.log('✅ Tabela migrations criada com sucesso');
        }

        // Verifica e cria tabela system_config se não existir
        const hasSystemConfig = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'system_config'
            );
        `);
        
        if (!hasSystemConfig.rows[0].exists) {
            console.log('⚙️ Criando tabela system_config...');
            await client.query(`
                CREATE TABLE system_config (
                    id SERIAL PRIMARY KEY,
                    config_key VARCHAR(100) UNIQUE NOT NULL,
                    config_value TEXT,
                    description TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX idx_system_config_key ON system_config(config_key);
            `);
            console.log('✅ Tabela system_config criada com sucesso');
        }
        
        console.log('✅ Setup do banco concluído com sucesso');
    } catch (error) {
        console.error('❌ Erro durante setup do banco:', error);
        throw error;
    }
}

module.exports = {
    createDatabaseBackup,
    setupDatabase
};
