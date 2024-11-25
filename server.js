const express = require('express');
const app = express();
const dotenv = require('dotenv');
const logger = require('./config/logger');
const setupSwagger = require('./config/swagger');
dotenv.config();

// Middleware
app.use(express.json());

// Middleware de logging melhorado
app.use((req, res, next) => {
  const start = Date.now();
  
  // Logging da requisição
  logger.info({
    type: 'REQUEST',
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    headers: req.headers
  });

  // Intercepta a resposta
  const oldSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    // Logging da resposta
    logger.info({
      type: 'RESPONSE',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      response: data
    });
    
    oldSend.apply(res, arguments);
  };

  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error({
    type: 'ERROR',
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack
  });
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

// Configurar Swagger
setupSwagger(app);

// Rotas
const routes = require('./src/routes/index');
app.use('/', routes);

// Porta
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info({
    type: 'SERVER_START',
    message: `Servidor rodando na porta ${PORT}`,
    port: PORT,
    nodeEnv: process.env.NODE_ENV
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error({
    type: 'UNCAUGHT_EXCEPTION',
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error({
    type: 'UNHANDLED_REJECTION',
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});
