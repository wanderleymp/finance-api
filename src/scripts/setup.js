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
        console.log(' Iniciando backup do banco de dados...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupPath, `${database}_${timestamp}.sql`);
        
        const tables = await client.query(`
            SELECT tablename 
            FROM pg_catalog.pg_tables 
            WHERE schemaname = 'public'
        `);
        
        console.log(` Gerando backup de ${tables.rows.length} tabelas...`);
        
        let backupContent = '';
        for (const table of tables.rows) {
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
        console.log(` Backup concluído: ${backupFile}`);
        return backupFile;
    } catch (error) {
        console.error(' Erro durante backup:', error);
        throw error;
    }
}

/**
 * Sets up the database with required tables
 * @param {Object} client - Database client
 */
async function setupDatabase(client) {
    try {
        console.log(' Verificando tabelas do sistema...');
        
        const result = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.schemata 
                WHERE schema_name = 'system'
            );
        `);

        if (!result.rows[0].exists) {
            console.log(' Criando schema system...');
            await client.query('CREATE SCHEMA system');
        }

        // Verifica se a tabela system_config existe
        const systemConfigResult = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'system' 
                AND table_name = 'system_config'
            );
        `);

        if (!systemConfigResult.rows[0].exists) {
            console.log(' Criando tabela system_config...');
            await client.query(`
                CREATE TABLE system.system_config (
                    id SERIAL PRIMARY KEY,
                    config_key VARCHAR(255) NOT NULL UNIQUE,
                    config_value TEXT,
                    description TEXT DEFAULT '',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );

                CREATE INDEX idx_system_config_key ON system.system_config(config_key);
            `);

            console.log(' Tabela system_config criada com sucesso');

            // Insere configurações iniciais
            await client.query(`
                INSERT INTO system.system_config (config_key, config_value, description)
                VALUES 
                ('db_version', '1.0.0.1', 'Versão inicial do banco de dados')
            `);
        }

        // Verifica se a tabela migrations existe
        const migrationsResult = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'system' 
                AND table_name = 'migrations'
            );
        `);

        if (!migrationsResult.rows[0].exists) {
            console.log(' Criando tabela migrations...');
            await client.query(`
                CREATE TABLE system.migrations (
                    id SERIAL PRIMARY KEY,
                    migration_name VARCHAR(255) NOT NULL,
                    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    db_version VARCHAR(50) NOT NULL,
                    database_name VARCHAR(100) NOT NULL,
                    description TEXT DEFAULT ''
                );
            `);

            console.log(' Tabela migrations criada com sucesso');
        }

        console.log(' Setup do banco concluído com sucesso');
    } catch (error) {
        console.error(' Erro durante setup:', error);
        throw error;
    }
}

module.exports = {
    createDatabaseBackup,
    setupDatabase
};
