require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { systemDatabase } = require('../src/config/database');
const { logger } = require('../src/middlewares/logger');

async function getMigrationFiles() {
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = await fs.readdir(migrationsDir);
    return files
        .filter(file => file.endsWith('.js'))
        .sort(); // Garante ordem alfabética/cronológica
}

async function createMigrationsTable() {
    try {
        await systemDatabase.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (error) {
        logger.error('Erro ao criar tabela de migrações', { error });
        throw error;
    }
}

async function getMigratedFiles() {
    try {
        const result = await systemDatabase.query(
            'SELECT name FROM migrations ORDER BY executed_at ASC'
        );
        return result.rows.map(row => row.name);
    } catch (error) {
        logger.error('Erro ao buscar migrações executadas', { error });
        throw error;
    }
}

async function executeMigration(migrationName, migrationPath) {
    const migration = require(migrationPath);
    
    try {
        logger.info(`Iniciando migração: ${migrationName}`);
        
        await systemDatabase.query('BEGIN');
        
        await migration.up();
        
        await systemDatabase.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [migrationName]
        );
        
        await systemDatabase.query('COMMIT');
        
        logger.info(`Migração concluída: ${migrationName}`);
    } catch (error) {
        await systemDatabase.query('ROLLBACK');
        logger.error(`Erro na migração ${migrationName}`, { error });
        throw error;
    }
}

async function migrate() {
    try {
        await createMigrationsTable();
        
        const executedMigrations = await getMigratedFiles();
        const migrationFiles = await getMigrationFiles();
        
        for (const file of migrationFiles) {
            if (!executedMigrations.includes(file)) {
                const migrationPath = path.join(__dirname, '../migrations', file);
                await executeMigration(file, migrationPath);
            } else {
                logger.info(`Migração ${file} já foi executada`);
            }
        }
        
        logger.info('Todas as migrações foram executadas com sucesso');
    } catch (error) {
        logger.error('Erro ao executar migrações', { 
            error: error.message,
            stack: error.stack 
        });
        process.exit(1);
    } finally {
        await systemDatabase.end();
    }
}

// Executa as migrações
migrate();
