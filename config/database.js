const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_CONNECTION_URI, // Usa a string de conexão diretamente
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false, // Configuração SSL opcional
});

pool.on('connect', () => {
  console.log('Connected to the database');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
