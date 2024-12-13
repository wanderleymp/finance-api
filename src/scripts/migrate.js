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

    // Conectar ao banco de dados
    client = await pool.connect();

    // Verificar se as migrações já foram aplicadas
    let hasPreviousMigrations = false;
    try {
      const migrationCheck = await client.query(`
        SELECT COUNT(*) as migration_count 
        FROM migrations 
        WHERE database_name = $1
      `, [parsedConfig.database]);
      
      hasPreviousMigrations = parseInt(migrationCheck.rows[0].migration_count) > 0;
    } catch (tableNotExistsError) {
      // Se a tabela não existe, consideramos que não há migrações prévias
      console.log('📝 Tabela de migrações não existe. Iniciando primeira migração.');
      hasPreviousMigrations = false;
    }

    // Verificar se há migrações pendentes
    async function getPendingMigrations(client, files, databaseName) {
      const pendingMigrations = [];

      for (const migrationFile of files) {
        const migrationCheck = await client.query(
          `SELECT * FROM migrations 
           WHERE migration_name = $1 AND database_name = $2`,
          [migrationFile, databaseName]
        );

        if (migrationCheck.rows.length === 0) {
          pendingMigrations.push(migrationFile);
        }
      }

      return pendingMigrations;
    }

    const pendingMigrations = await getPendingMigrations(client, files, parsedConfig.database);

    // Só criar backup se houver migrações para aplicar
    let backupFile = null;
    if (pendingMigrations.length > 0 && !hasPreviousMigrations) {
      backupFile = createDatabaseBackup(parsedConfig.database, backupPath, parsedConfig);
      
      if (!backupFile || !fs.existsSync(backupFile)) {
        throw new Error('Falha na criação do backup do banco de dados');
      }
      
      console.log(`💾 Backup criado: ${backupFile}`);
    } else {
      console.log('📝 Nenhuma migração pendente ou já migrado. Backup não necessário.');
    }

    // Se não há migrações pendentes, retornar
    if (pendingMigrations.length === 0) {
      console.log('🎉 Nenhuma migração pendente. Processo concluído.');
      return;
    }

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

    // Verificar estrutura da tabela
    async function checkTableStructure(client, tableName, expectedColumns) {
      try {
        const structureQuery = `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = $1
        `;
        const result = await client.query(structureQuery, [tableName]);
        
        const currentColumns = result.rows.map(row => ({
          name: row.column_name,
          type: row.data_type
        }));

        // Comparar estruturas
        const missingColumns = expectedColumns.filter(
          expected => !currentColumns.some(
            current => current.name === expected.name && 
                       current.type.toLowerCase() === expected.type.toLowerCase()
          )
        );

        return missingColumns.length === 0;
      } catch (error) {
        // Tabela não existe
        return false;
      }
    }

    // Execução das migrações com mais verificações
    console.log(`🔍 Migrações pendentes: ${pendingMigrations.length}`);

    // Executar apenas migrações pendentes
    for (const migrationFile of pendingMigrations) {
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
