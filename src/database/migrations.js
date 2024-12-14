const { pool } = require('./connection');
const fs = require('fs').promises;
const path = require('path');

async function checkAndRunMigrations() {
    try {
        // Verifica se existe a tabela migrations
        const hasMigrationsTable = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'migrations'
            );
        `);

        if (!hasMigrationsTable.rows[0].exists) {
            await pool.query(`
                CREATE TABLE migrations (
                    id SERIAL PRIMARY KEY,
                    migration_name VARCHAR(255) NOT NULL,
                    db_version VARCHAR(50) NOT NULL,
                    applied_at TIMESTAMP NOT NULL
                );
            `);
        }

        // Verifica se a migração específica já foi aplicada
        const migrationName = '20241214_adjust_contacts.sql';
        const migrationVersion = '1.0.0.7';
        
        const migrationExists = await pool.query(
            'SELECT EXISTS(SELECT 1 FROM migrations WHERE migration_name = $1)',
            [migrationName]
        );

        if (!migrationExists.rows[0].exists) {
            // Verifica se a tabela contact_types existe
            const hasContactTypesTable = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'contact_types'
                );
            `);

            if (hasContactTypesTable.rows[0].exists) {
                // Executa a migração
                const migrationSQL = await fs.readFile(
                    path.join(__dirname, '../../migrations/20241214_adjust_contacts.sql'),
                    'utf8'
                );
                
                await pool.query(migrationSQL);
                
                console.log('📊 Migração da tabela contacts concluída com sucesso');
            }
        }

    } catch (error) {
        console.error('Erro ao executar migração:', error);
        throw error;
    }
}

module.exports = {
    checkAndRunMigrations
};
