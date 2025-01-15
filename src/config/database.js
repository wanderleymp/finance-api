const { Pool } = require('pg');
const { logger } = require('../middlewares/logger');
require('dotenv').config();

const createDatabaseConnection = (databaseUrl, name) => {
  // Validação mais robusta da URL do banco
  if (!databaseUrl || typeof databaseUrl !== 'string') {
    logger.error('ERRO CRÍTICO: Configuração de banco de dados inválida', {
      envVars: {
        DATABASE_URL: process.env.DATABASE_URL,
        SYSTEM_DATABASE_URL: process.env.SYSTEM_DATABASE_URL
      }
    });
    throw new Error('Configuração de banco de dados inválida ou ausente');
  }
  
  // Log de conexão mais detalhado
  logger.info(`Configurando conexão segura com banco ${name}`, { 
    databaseUrl: databaseUrl.replace(/:[^:]*@/, ':****@'),
    timestamp: new Date().toISOString()
  });
  
  // Remover parâmetro SSL da URL com mais segurança
  const cleanUrl = databaseUrl.replace(/\?.*$/, '');
  
  const pool = new Pool({
    connectionString: cleanUrl,
    ssl: false,
    connectionTimeoutMillis: 10000,  // Aumentar timeout de conexão
    idleTimeoutMillis: 60000,        // Timeout de conexão ociosa maior
    max: 15,                         // Aumentar pool de conexões
    
    // Configurações de retry
    application_name: 'FinanceAPI',
    keepAlive: true,
    statement_timeout: 30000,        // Timeout para statements
    query_timeout: 20000             // Timeout para queries
  });

  // Log de erros mais detalhado
  pool.on('error', (err, client) => {
    logger.error(`Erro CRÍTICO no pool de conexão para ${name}`, {
      errorMessage: err.message,
      errorCode: err.code,
      errorStack: err.stack,
      clientInfo: {
        user: client?.user,
        database: client?.database
      },
      timestamp: new Date().toISOString()
    });
  });

  return {
    pool,
    async testConnection() {
      try {
        logger.info(`Iniciando teste de conexão robusto para ${name}`);
        
        const client = await pool.connect();
        logger.info(`Conexão estabelecida com sucesso para ${name}`);
        
        try {
          const result = await client.query('SELECT NOW()');
          logger.info('Teste de conexão bem-sucedido', {
            serverTime: result.rows[0].now,
            timestamp: new Date().toISOString()
          });
        } finally {
          client.release();
        }
      } catch (error) {
        logger.error(`Falha no teste de conexão para ${name}`, {
          errorMessage: error.message,
          errorStack: error.stack,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    }
  };
}

// Criar instância única da conexão com mais segurança
const systemDatabase = createDatabaseConnection(
  process.env.SYSTEM_DATABASE_URL || process.env.DATABASE_URL, 
  'AgileDB'
);

async function connectToDatabase() {
  try {
    await systemDatabase.testConnection();
    logger.info('Conexão com banco de dados estabelecida com sucesso');
  } catch (error) {
    logger.error('Falha crítica na conexão com banco de dados', {
      errorMessage: error.message,
      timestamp: new Date().toISOString()
    });
    // Implementar estratégia de retry ou notificação
    process.exit(1);
  }
}

// Testar conexão na inicialização
connectToDatabase();

module.exports = {
  systemDatabase,
  connectToDatabase
};
