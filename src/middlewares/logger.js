const winston = require('winston');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Caminho absoluto para logs
const logDir = '/tmp/finance-api-logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Configuração do Logger Winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'finance-api' },
  transports: [
    // Logs de erro em arquivo separado
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Logs combinados em outro arquivo
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Log no console para desenvolvimento
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Configuração do Morgan para logs HTTP
const httpLogger = morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
});

// Função para log de erro centralizada
const logError = (error, context = {}) => {
  logger.error('Erro capturado', {
    message: error.message,
    stack: error.stack,
    ...context
  });
};

module.exports = { 
  logger, 
  httpLogger,
  logError 
};
