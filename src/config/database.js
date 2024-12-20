const { Pool } = require('pg');
const { logger } = require('../middlewares/logger');
require('dotenv').config();

const createDatabaseConnection = (databaseUrl, name) => {
  logger.info(`Configurando conexão com banco ${name}`);
  
  // Remover parâmetro SSL da URL
  const cleanUrl = databaseUrl.replace(/\?.*$/, '');
  
  const pool = new Pool({
    connectionString: cleanUrl,
    ssl: false,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 10
  });

  // Adicionar log de erros no pool
  pool.on('error', (err) => {
    logger.error(`Erro no pool de conexão para ${name}:`, err);
  });

  return {
    pool,
    async testConnection() {
      try {
        logger.info(`Iniciando teste de conexão para ${name}`);
        
        const client = await pool.connect();
        logger.info(`Conexão estabelecida com sucesso para ${name}`);
        
        try {
          const result = await client.query('SELECT NOW()');
          logger.info(`Consulta de teste bem-sucedida para ${name}:`, result.rows);
        } catch (queryError) {
          logger.error(`Erro na consulta de teste para ${name}:`, queryError);
          throw queryError;
        } finally {
          client.release();
        }

        return { success: true, database: name };
      } catch (connectionError) {
        logger.error(`Erro de conexão para ${name}:`, connectionError);
        return { 
          success: false, 
          database: name, 
          error: connectionError.message 
        };
      }
    },
    async query(text, params) {
      const client = await pool.connect();
      try {
        const start = Date.now();
        const result = await client.query(text, params);
        const duration = Date.now() - start;
        logger.info(`Consulta executada`, {
          query: text,
          duration,
          rows: result.rowCount
        });
        return result;
      } finally {
        client.release();
      }
    }
  };
};

// Criar instância única da conexão
const systemDatabase = createDatabaseConnection(process.env.DATABASE_URL || process.env.SYSTEM_DATABASE_URL, 'AgileDB');

// Função para testar a conexão com o banco
async function connectToDatabase() {
  const result = await systemDatabase.testConnection();
  if (!result.success) {
    throw new Error(`Falha ao conectar com o banco de dados: ${result.error}`);
  }
  return result;
}

module.exports = {
  systemDatabase,
  connectToDatabase
};
