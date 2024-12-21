const winston = require('winston');
const morgan = require('morgan');

const logger = {
  error: (message, context = {}) => console.error(message, context),
  warn: (message, context = {}) => console.warn(message, context),
  info: (message, context = {}) => console.info(message, context),
  debug: (message, context = {}) => console.debug(message, context)
};

const httpLogger = morgan('combined');

module.exports = { 
  logger,
  httpLogger
};
