import winston from 'winston';
import path from 'path';

// Configuração dos transportes de log
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Configuração do logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Log de erros
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      handleExceptions: true,
    }),
    // Log combinado
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      handleExceptions: true,
    }),
  ],
});

// Adicionar console logger em ambiente de desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
