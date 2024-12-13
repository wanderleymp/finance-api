const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function createDatabaseBackup(databaseName, backupPath, config) {
  // Garantir que o diretório de backup exista
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }

  // Gerar nome de arquivo com timestamp
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const backupFileName = `${databaseName}_backup_${timestamp}.sql`;
  const fullBackupPath = path.join(backupPath, backupFileName);

  try {
    // Configurar variáveis de ambiente para autenticação
    const env = { ...process.env };
    env['PGPASSWORD'] = config.password;

    // Executar pg_dump para criar backup
    const pgDumpCommand = `pg_dump -h ${config.host} -p ${config.port} -U ${config.user} -d ${databaseName} -f "${fullBackupPath}"`;
    
    console.log(`🔒 Criando backup do banco de dados: ${backupFileName}`);
    execSync(pgDumpCommand, { 
      stdio: 'inherit', 
      env: env 
    });

    console.log(`💾 Backup criado com sucesso: ${fullBackupPath}`);
    return fullBackupPath;
  } catch (error) {
    console.error('❌ Erro ao criar backup do banco de dados:', error);
    throw error;
  }
}

module.exports = { createDatabaseBackup };
