const { createLogger, format, transports } = require('winston');

const customFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.metadata(),
  format.json(),
  format.printf(({ timestamp, level, message, metadata, stack }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (metadata.duration) {
      log += ` (Duration: ${metadata.duration}ms)`;
    }
    if (metadata.data) {
      log += `\nData: ${JSON.stringify(metadata.data, null, 2)}`;
    }
    if (stack) {
      log += `\nStack: ${stack}`;
    }
    return log;
  })
);

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        customFormat
      )
    }),
    new transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
  ],
});

module.exports = logger;
