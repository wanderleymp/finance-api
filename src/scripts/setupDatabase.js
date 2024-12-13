const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { databases, parseDatabaseConfig } = require('../config/databases');

async function setupDatabase(databaseKey = 'system') {
    const databaseConfig = databases[databaseKey];
    if (!databaseConfig) {
        throw new Error(`Configuração de banco de dados não encontrada para: ${databaseKey}`);
    }

    const parsedConfig = parseDatabaseConfig(databaseConfig);
    const { url } = databaseConfig;

    const pool = new Pool({
        connectionString: url,
        ssl: false
    });

    let client;
    try {
        client = await pool.connect();

        // Verifica se o banco existe
        const databaseExists = await checkDatabaseExists(client, parsedConfig.database);
        
        if (!databaseExists) {
            console.log(`✅ Criando banco de dados "${parsedConfig.database}"...`);
            await createDatabase(client, parsedConfig.database);
            
            // Aplica o schema base para banco novo
            const baseSchemaPath = path.join(__dirname, 'base_schema.sql');
            if (fs.existsSync(baseSchemaPath)) {
                const baseSchema = fs.readFileSync(baseSchemaPath, 'utf8');
                await client.query(baseSchema);
                console.log('✅ Schema base aplicado com sucesso');
            }
        } else {
            console.log(`✅ Banco de dados "${parsedConfig.database}" já existe.`);
        }

        return true;
    } catch (error) {
        console.error('Erro ao configurar banco de dados:', error);
        throw error;
    } finally {
        if (client) {
            client.release();
        }
    }
}

async function checkDatabaseExists(client, databaseName) {
    const result = await client.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [databaseName]
    );
    return result.rows.length > 0;
}

async function createDatabase(client, databaseName) {
    await client.query(`CREATE DATABASE "${databaseName}"`);
}

module.exports = { setupDatabase };
