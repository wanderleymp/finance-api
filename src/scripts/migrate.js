const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { setupDatabase } = require('./setupDatabase');
const { databases, parseDatabaseConfig } = require('../config/databases');

async function runMigrations(databaseKey = 'system') {
  const databaseConfig = databases[databaseKey];
  if (!databaseConfig) {
    throw new Error(`Configuração de banco de dados não encontrada para: ${databaseKey}`);
  }

  const { url, migrationsPath } = databaseConfig;
  const parsedConfig = parseDatabaseConfig(databaseConfig);

  const pool = new Pool({ 
    connectionString: url,
    ssl: false
  });

  try {
    await setupDatabase(databaseKey);

    const fullMigrationsPath = path.join(__dirname, '..', migrationsPath);
    const files = fs.existsSync(fullMigrationsPath) 
      ? fs.readdirSync(fullMigrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort()
      : [];

    const client = await pool.connect();

    try {
      // Verificar se a tabela de migrations existe
      const { rows: tableExists } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'migrations'
        ) AS table_exists;
      `);

      // Se a tabela não existir, criar
      if (!tableExists[0].table_exists) {
        await client.query(`
          CREATE TABLE migrations (
            id SERIAL PRIMARY KEY,
            migration_name VARCHAR(255) NOT NULL,
            applied_at TIMESTAMPTZ DEFAULT NOW(),
            db_version VARCHAR(50) NOT NULL,
            database_name VARCHAR(100) NOT NULL
          );
        `);
        console.log(' Tabela de Controle de Migrações Criada');
      }

      for (const file of files) {
        const { rows } = await client.query(
          'SELECT * FROM migrations WHERE migration_name = $1 AND database_name = $2',
          [file, parsedConfig.database]
        );

        if (rows.length > 0) {
          console.log(` Migração já aplicada: ${file}`);
          continue;
        }

        const filePath = path.join(fullMigrationsPath, file);
        const query = fs.readFileSync(filePath, 'utf-8');
        await client.query(query);

        await client.query(
          `INSERT INTO migrations (migration_name, db_version, database_name) VALUES ($1, $2, $3)`,
          [file, '1.0.0', parsedConfig.database]
        );
        console.log(` Migração Aplicada: ${file}`);
      }
    } catch (error) {
      console.error(' Erro durante migração:', error.message);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(' Falha no processo de migração:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

module.exports = { runMigrations };
