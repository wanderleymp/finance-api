const winston = require('winston');
const morgan = require('morgan');
const path = require('path');

// Configuração dos transportes do Winston
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'finance-api' },
  transports: [
    // Log de erro em arquivo separado
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'), 
      level: 'error',
      handleExceptions: true
    }),
    // Log combinado
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/combined.log'),
      handleExceptions: true
    }),
    // Log no console para desenvolvimento
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
  exitOnError: false
});

// Métodos de log personalizados
const customLogger = {
  error: (message, context = {}) => {
    logger.error(message, context);
  },
  warn: (message, context = {}) => {
    logger.warn(message, context);
  },
  info: (message, context = {}) => {
    logger.info(message, context);
  },
  debug: (message, context = {}) => {
    logger.debug(message, context);
  }
};

const httpLogger = morgan('combined', {
  stream: {
    write: (message) => {
      logger.info(message.trim());
    }
  }
});

module.exports = { 
  logger: customLogger,
  httpLogger
};
