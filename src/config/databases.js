const url = require('url');
require('dotenv').config();

const databases = {
  system: {
    url: process.env.SYSTEM_DATABASE_URL.replace('ssl=false', ''),
    migrationsPath: './src/migrations/system',
    name: 'AgileDev'
  },
  // Exemplo de como adicionar outro banco no futuro
  // dev: {
  //   url: process.env.DEV_DATABASE_URL,
  //   migrationsPath: './src/migrations/dev',
  //   name: 'dev_history'
  // }
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
