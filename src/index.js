const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const { logger, loggerMiddleware } = require('./middlewares/logger');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware global
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(loggerMiddleware);

// Importar rotas
const userRoutes = require('./routes/userRoutes');
const healthRoutes = require('./routes/healthRoutes');

// Configurar rotas
app.use('/api/users', userRoutes);
app.use('/health', healthRoutes);

// Rota raiz para verificação de saúde
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Finance API está funcionando!',
    status: 'OK'
  });
});

// Middleware de tratamento de rotas não encontradas
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: 'O endpoint solicitado não existe.'
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  logger.error('Erro não tratado', { error: err });
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: 'Ocorreu um erro inesperado.'
  });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
});

// Tratamento de encerramento graciosos
process.on('SIGTERM', () => {
  logger.info('Recebendo SIGTERM. Encerrando servidor...');
  server.close(() => {
    logger.info('Servidor encerrado.');
    process.exit(0);
  });
});

module.exports = app;
