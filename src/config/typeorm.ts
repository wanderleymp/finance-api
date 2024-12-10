import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  
  // Configurações de SSL para produção
  ssl: isProduction ? { 
    rejectUnauthorized: false,
    ca: process.env.DB_SSL_CA // Opcional: certificado CA se necessário
  } : false,

  // Desabilitar sincronização automática
  synchronize: false,
  
  // Não executar migrações automaticamente
  migrationsRun: false,

  // Configurações de log detalhadas
  logging: isProduction 
    ? ['error', 'warn'] 
    : ['query', 'schema', 'error', 'warn', 'info', 'log'],
  
  // Caminho absoluto para entidades
  entities: [
    path.join(__dirname, '..', 'entities', '**', '*.{ts,js}')
  ],
  
  // Caminho absoluto para migrações
  migrations: [
    path.join(__dirname, '..', 'migrations', '**', '*.{ts,js}')
  ],

  // Configurações adicionais de conexão
  connectTimeoutMS: 5000,
  maxQueryExecutionTime: 5000, // 5 segundos
  
  // Pooling de conexões
  poolSize: isProduction ? 10 : 5,
  extra: {
    connectionLimit: isProduction ? 10 : 5,
  }
};

export const AppDataSource = new DataSource(dataSourceOptions);

export async function initializeDatabase() {
  try {
    console.log('Inicializando conexão com banco de dados...');
    console.log('Configurações:', {
      host: dataSourceOptions.url?.split('@')[1]?.split(':')[0],
      database: dataSourceOptions.url?.split('/')?.pop(),
      ssl: !!dataSourceOptions.ssl,
      logging: dataSourceOptions.logging
    });

    await AppDataSource.initialize();
    console.log('✅ Conexão com banco de dados estabelecida com sucesso');
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
    process.exit(1);
  }
}

// Exportar opções para uso em outros lugares, se necessário
export { dataSourceOptions };
