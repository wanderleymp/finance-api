const { Pool } = require('pg');
require('dotenv').config({ path: '/root/finance-api/.env' });

async function checkMigrations() {
  const pool = new Pool({
    connectionString: process.env.SYSTEM_DATABASE_URL.replace('?ssl=false', ''),
    ssl: false
  });

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM migrations');
    console.log(JSON.stringify(result.rows, null, 2));
    client.release();
  } catch (error) {
    console.error('Erro ao consultar migrações:', error);
  } finally {
    await pool.end();
  }
}

checkMigrations();
