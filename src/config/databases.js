const url = require('url');
require('dotenv').config();

const databases = {
  system: {
    url: process.env.SYSTEM_DATABASE_URL.replace('ssl=false', ''),
    migrationsPath: './src/migrations/system', // Alterado o caminho
    name: 'FinanceDev'
  },
  dev: {
    url: process.env.DEV_DATABASE_URL.replace('ssl=false', ''),
    migrationsPath: './src/migrations/dev', // Alterado o caminho
    name: 'FinanceDev'
  }
};

function parseDatabaseConfig(databaseConfig) {
  const parsedUrl = new url.URL(databaseConfig.url);
  return {
    host: parsedUrl.hostname,
    port: parsedUrl.port || 5432,
    user: parsedUrl.username,
    password: parsedUrl.password,
    database: parsedUrl.pathname.substring(1),
    connectionParams: {
      host: parsedUrl.hostname,
      port: parsedUrl.port || 5432,
      user: parsedUrl.username,
      password: parsedUrl.password,
      database: 'postgres',  // Conexão para criar novo banco
      ssl: false  // Desabilitar SSL explicitamente
    }
  };
}

module.exports = {
  databases,
  parseDatabaseConfig
};
