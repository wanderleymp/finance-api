const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const { httpLogger, logger } = require('./middlewares/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Carregar variáveis de ambiente
dotenv.config();

// Middleware global
app.use(cors());
app.use(httpLogger);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Importar rotas
const healthRoutes = require('./routes/healthRoutes');
const roadmapRoutes = require('./routes/roadmapRoutes');

// Configurar rotas
app.use('/health', healthRoutes);
app.use('/roadmap', roadmapRoutes);

// Rota inicial
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Finance API está funcionando',
    version: '0.8.0'
  });
});

// Middleware de tratamento de rotas não encontradas
app.use((req, res, next) => {
  logger.warn(`Rota não encontrada: ${req.method} ${req.url}`);
  res.status(404).json({
    status: 'error',
    message: 'Rota não encontrada'
  });
});

// Middleware de tratamento de erros global
app.use((err, req, res, next) => {
  logger.error('Erro não tratado', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url
  });

  res.status(500).json({
    status: 'error',
    message: 'Erro interno do servidor'
  });
});

// Tratar exceções não capturadas
process.on('uncaughtException', (err) => {
  logger.error(`❌ Erro não tratado: ${err.message}`, {
    stack: err.stack
  });
  
  // Encerrar o processo após logar o erro
  process.exit(1);
});

// Tratar rejeições de promises não tratadas
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Rejeição de promise não tratada', {
    reason: reason,
    promise: promise
  });
});

// Iniciar o servidor
const server = app.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando na porta ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Recebido sinal SIGTERM. Encerrando graciosamente...');
  server.close(() => {
    logger.info('Servidor encerrado.');
    process.exit(0);
  });
});

module.exports = app;
