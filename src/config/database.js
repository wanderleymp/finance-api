const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000, // tempo máximo de inatividade
  connectionTimeoutMillis: 2000, // tempo máximo para estabelecer conexão
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
};
