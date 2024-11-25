const { Pool } = require('pg');
const dotenv = require('dotenv');
const logger = require('./logger');
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_CONNECTION_URI,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Teste de conexão inicial
pool.connect((err, client, release) => {
  if (err) {
    logger.error(`Erro na conexão com o banco de dados: ${err.message}`);
    return;
  }
  logger.info('Conexão com o banco de dados estabelecida com sucesso');
  release();
});

module.exports = pool;
