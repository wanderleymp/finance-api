const winston = require('winston');

// Configuração do logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
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
    // Logs de erro em um arquivo separado
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    // Logs combinados em outro arquivo
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Se não estiver em produção, adiciona log no console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Middleware de logging
const loggerMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Log de requisição
  logger.info(`${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    body: req.body,
    query: req.query,
    headers: req.headers
  });

  // Captura a resposta original
  const oldWrite = res.write;
  const oldEnd = res.end;
  const chunks = [];

  res.write = function(chunk) {
    chunks.push(chunk);
    oldWrite.apply(res, arguments);
  };

  res.end = function(chunk) {
    if (chunk) {
      chunks.push(chunk);
    }
    
    const responseTime = Date.now() - startTime;
    
    // Log de resposta
    logger.info(`${req.method} ${req.url} - ${res.statusCode}`, {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime: `${responseTime}ms`
    });

    oldEnd.apply(res, arguments);
  };

  next();
};

module.exports = {
  logger,
  loggerMiddleware
};
