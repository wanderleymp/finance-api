const winston = require('winston');
const morgan = require('morgan');
const path = require('path');
require('winston-daily-rotate-file');

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
    // Log de erro com rotação diária
    new winston.transports.DailyRotateFile({ 
      filename: path.join(__dirname, '../../logs/error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      handleExceptions: true
    }),
    // Log combinado com rotação diária
    new winston.transports.DailyRotateFile({ 
      filename: path.join(__dirname, '../../logs/combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      handleExceptions: true
    }),
    // Log no console para desenvolvimento
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ level, message, timestamp, ...metadata }) => {
          let msg = `${timestamp} [${level}]: ${message} `;
          const metaStr = JSON.stringify(metadata);
          if (metaStr !== '{}') msg += metaStr;
          console.log(msg);  // Força log no console
          return msg;
        })
      )
    })
  ],
  exitOnError: false
});

// Métodos de log personalizados
const customLogger = {
  error: (message, context = {}) => {
    logger.error(message, { ...context, timestamp: new Date().toISOString() });
  },
  warn: (message, context = {}) => {
    logger.warn(message, { ...context, timestamp: new Date().toISOString() });
  },
  info: (message, context = {}) => {
    logger.info(message, { ...context, timestamp: new Date().toISOString() });
  },
  debug: (message, context = {}) => {
    logger.debug(message, { ...context, timestamp: new Date().toISOString() });
  }
};

// Configuração do Morgan para logging de HTTP
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
