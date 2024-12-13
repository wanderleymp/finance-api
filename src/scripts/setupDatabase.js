const { Client } = require('pg');
const { databases, parseDatabaseConfig } = require('../config/databases');

async function setupDatabase(databaseKey = 'system') {
  const databaseConfig = databases[databaseKey];
  if (!databaseConfig) {
    throw new Error(`Configuração de banco de dados não encontrada para: ${databaseKey}`);
  }

  const { connectionParams, database } = parseDatabaseConfig(databaseConfig);

  const client = new Client(connectionParams);

  try {
    await client.connect();

    const dbCheck = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [database]
    );

    if (dbCheck.rows.length === 0) {
      await client.query(`CREATE DATABASE "${database}"`);
      console.log(`📊 Banco de dados "${database}" criado com sucesso.`);
    } else {
      console.log(`✅ Banco de dados "${database}" já existe.`);
    }
  } catch (error) {
    console.error(`❌ Erro ao verificar/criar banco de dados ${database}:`, error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

module.exports = { setupDatabase };
