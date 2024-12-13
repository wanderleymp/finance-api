const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { setupDatabase } = require('./setupDatabase');
const { databases, parseDatabaseConfig } = require('../config/databases');
const { requiredDbVersion, appVersion, isCompatibleVersion } = require('../config/version');
const { createDatabaseBackup } = require('./backup');

async function runMigrations(databaseKey = 'system') {
  console.log('🚀 Iniciando processo de migração');
  const databaseConfig = databases[databaseKey];
  if (!databaseConfig) {
    throw new Error(`Configuração de banco de dados não encontrada para: ${databaseKey}`);
  }

  const parsedConfig = parseDatabaseConfig(databaseConfig);
  const { url, migrationsPath } = databaseConfig;

  console.log('📦 Configurações de banco de dados:', {
    database: parsedConfig.database,
    host: parsedConfig.host,
    user: parsedConfig.user,
    migrationsPath: migrationsPath
  });

  // Caminho para armazenar backups
  const backupPath = '/var/backups/finance-api-new';

  // Garantir que o diretório de backup exista
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }

  const pool = new Pool({ 
    connectionString: url,
    ssl: false
  });

  let client;
  try {
    console.log('🔧 Configurando banco de dados');
    await setupDatabase(databaseKey);

    const fullMigrationsPath = path.join(__dirname, '../migrations/system');
    console.log('📂 Caminho completo das migrações:', fullMigrationsPath);

    // Log detalhado de migrações
    console.log('🔍 Detalhes de migração:', {
      migrationsPath,
      fullMigrationsPath,
      exists: fs.existsSync(fullMigrationsPath),
      contents: fs.existsSync(fullMigrationsPath) ? fs.readdirSync(fullMigrationsPath) : 'Não existe'
    });

    const files = fs.existsSync(fullMigrationsPath) 
      ? fs.readdirSync(fullMigrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort()
      : [];
    
    console.log('📋 Arquivos de migração encontrados:', files);

    // Criar backup antes de qualquer migração
    const backupFile = createDatabaseBackup(parsedConfig.database, backupPath, parsedConfig);
    
    if (!backupFile || !fs.existsSync(backupFile)) {
      throw new Error('Falha na criação do backup do banco de dados');
    }
    
    console.log(`💾 Backup criado: ${backupFile}`);

    // Conectar ao banco de dados
    client = await pool.connect();

    // Dropando e recriando tabelas de migração e configuração
    await client.query(`
      DROP TABLE IF EXISTS migrations, system_config CASCADE;
    `);

    // Recriando tabelas
    await client.query(`
      CREATE TABLE migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW(),
        db_version VARCHAR(50) NOT NULL,
        database_name VARCHAR(100) NOT NULL,
        description TEXT DEFAULT ''
      );

      CREATE TABLE system_config (
        id SERIAL PRIMARY KEY,
        config_key VARCHAR(255) NOT NULL UNIQUE,
        config_value TEXT,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Execução das migrações com mais verificações
    if (files.length === 0) {
      console.warn('⚠️ Nenhum arquivo de migração encontrado');
      return;
    }

    // Execução das migrações
    for (const migrationFile of files) {
      try {
        const migrationSql = fs.readFileSync(path.join(fullMigrationsPath, migrationFile), 'utf8');
        await client.query(migrationSql);
        
        // Registrar migração
        await client.query(
          `INSERT INTO migrations (migration_name, db_version, database_name, description) 
           VALUES ($1, $2, $3, $4)`,
          [migrationFile, requiredDbVersion, parsedConfig.database, `Migração: ${migrationFile}`]
        );
        
        console.log(`✅ Migração aplicada: ${migrationFile}`);
      } catch (migrationError) {
        console.error(`❌ Erro na migração ${migrationFile}:`, migrationError);
        throw migrationError;
      }
    }

    // Atualizar versão do banco de dados
    await client.query(`
      INSERT INTO system_config (config_key, config_value, description)
      VALUES ('db_version', $1, 'Versão atual do banco de dados')
      ON CONFLICT (config_key) DO UPDATE 
      SET config_value = $1, updated_at = NOW()
    `, [requiredDbVersion]);

    console.log(`🎉 Migração concluída com sucesso para versão ${requiredDbVersion}`);

  } catch (error) {
    console.error('❌ Processo de migração falhou:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

module.exports = { runMigrations };
