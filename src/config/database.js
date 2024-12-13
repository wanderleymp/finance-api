const { Pool } = require('pg');
require('dotenv').config();

const createDatabaseConnection = (databaseUrl, name) => {
  console.log(`Tentando conectar ao banco ${name} com URL: ${databaseUrl}`);
  
  // Remover parâmetro SSL da URL
  const cleanUrl = databaseUrl.replace(/\?.*$/, '');
  
  const pool = new Pool({
    connectionString: cleanUrl,
    ssl: false,
  });

  // Adicionar log de erros no pool
  pool.on('error', (err) => {
    console.error(`Erro no pool de conexão para ${name}:`, err);
  });

  return {
    async testConnection() {
      try {
        console.log(`Iniciando teste de conexão para ${name}`);
        console.log(`URL de conexão limpa: ${cleanUrl}`);
        
        const client = await pool.connect();
        console.log(`Conexão estabelecida com sucesso para ${name}`);
        
        try {
          const result = await client.query('SELECT NOW()');
          console.log(`Consulta de teste bem-sucedida para ${name}:`, result.rows);
        } catch (queryError) {
          console.error(`Erro na consulta de teste para ${name}:`, queryError);
          throw queryError;
        } finally {
          client.release();
        }

        return { success: true, database: name };
      } catch (connectionError) {
        console.error(`Erro de conexão para ${name}:`, connectionError);
        return { 
          success: false, 
          database: name, 
          error: connectionError.message 
        };
      }
    },
    async query(text, params) {
      try {
        const start = Date.now();
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
      } catch (error) {
        console.error('Query error', error);
        throw error;
      }
    },
    async getClient() {
      const client = await pool.connect();
      const query = client.query;
      const release = client.release;

      // Monkey patch the query method to log duration
      client.query = (...args) => {
        const start = Date.now();
        const queryPromise = query.apply(client, args);
        
        queryPromise.then(() => {
          const duration = Date.now() - start;
          console.log('Executed query', { duration });
        }).catch((error) => {
          console.error('Query error', error);
        });

        return queryPromise;
      };

      // Monkey patch the release method to log client release
      client.release = () => {
        console.log('Client released');
        return release.apply(client);
      };

      return client;
    }
  };
};

module.exports = {
  devDatabase: createDatabaseConnection(process.env.DEV_DATABASE_URL, 'dev_history'),
  systemDatabase: createDatabaseConnection(process.env.SYSTEM_DATABASE_URL, 'AgileDB')
};
