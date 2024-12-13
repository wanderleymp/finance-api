const fs = require('fs').promises;
const path = require('path');
const { systemDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');

async function checkDatabaseExists() {
    try {
        await systemDatabase.query('SELECT 1');
        return true;
    } catch (error) {
        if (error.code === '3D000') { // database does not exist
            return false;
        }
        throw error;
    }
}

async function setupNewDatabase() {
    logger.info('🔄 Configurando novo banco de dados...');
    
    try {
        // Ler o schema base
        const schemaPath = path.join(__dirname, 'schema', 'base_schema.sql');
        const baseSchema = await fs.readFile(schemaPath, 'utf8');
        
        // Executar o schema base
        await systemDatabase.query(baseSchema);
        
        logger.info('✅ Schema base aplicado com sucesso');
        return true;
    } catch (error) {
        logger.error('❌ Erro ao aplicar schema base', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

async function runMigrations() {
    logger.info('🔄 Verificando migrações pendentes...');
    
    try {
        const migrationsPath = path.join(__dirname, '..', 'migrations', 'system');
        const files = await fs.readdir(migrationsPath);
        
        // Obter migrações já aplicadas
        const { rows: appliedMigrations } = await systemDatabase.query(
            'SELECT migration_name FROM migrations'
        );
        const appliedFiles = appliedMigrations.map(m => m.migration_name);
        
        // Filtrar apenas migrações pendentes
        const pendingMigrations = files
            .filter(file => file.endsWith('.sql'))
            .filter(file => !appliedFiles.includes(file))
            .sort();
        
        if (pendingMigrations.length === 0) {
            logger.info('✅ Nenhuma migração pendente');
            return true;
        }
        
        // Aplicar migrações pendentes
        for (const migration of pendingMigrations) {
            const migrationPath = path.join(migrationsPath, migration);
            const sql = await fs.readFile(migrationPath, 'utf8');
            
            logger.info(`🔄 Aplicando migração: ${migration}`);
            await systemDatabase.query(sql);
            logger.info(`✅ Migração aplicada: ${migration}`);
        }
        
        return true;
    } catch (error) {
        logger.error('❌ Erro ao aplicar migrações', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

async function initializeDatabase() {
    try {
        const exists = await checkDatabaseExists();
        
        if (!exists) {
            logger.info('🆕 Banco de dados não existe. Criando novo...');
            await setupNewDatabase();
            logger.info('✅ Banco de dados criado e configurado com sucesso');
        } else {
            logger.info('🔍 Banco de dados já existe. Verificando migrações...');
            await runMigrations();
        }
        
        return true;
    } catch (error) {
        logger.error('❌ Erro na inicialização do banco', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

module.exports = {
    initializeDatabase,
    setupNewDatabase,
    runMigrations
};
