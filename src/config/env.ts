import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config({ 
  path: path.resolve(process.cwd(), '.env') 
});

// Função para obter variáveis de ambiente com valor padrão
export const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  
  if (value === undefined) {
    throw new Error(`Variável de ambiente ${key} não definida`);
  }
  
  return value;
};

// Exportar variáveis de ambiente principais
export const ENV = {
  DATABASE_URL: getEnv('DATABASE_URL'),
  PORT: getEnv('PORT', '3000'),
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  JWT_SECRET: getEnv('JWT_SECRET')
};
