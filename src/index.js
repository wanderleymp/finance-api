const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const { httpLogger, logger } = require('./middlewares/logger');
const { createRabbitMQConnection, checkRabbitMQHealth } = require('./config/rabbitmq');
const roadmapService = require('./services/roadmapService');
const { runMigrations } = require('./scripts/migrate');
const { systemDatabase } = require('./config/database');

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
const roadmapRoutes = require('./routes/roadmapRoutes');
const personRoutes = require('./routes/personRoutes');
const personDocumentRoutes = require('./routes/personDocumentRoutes');
app.use('/roadmap/', roadmapRoutes);
app.use('/persons/', personRoutes);
app.use('/person-documents/', personDocumentRoutes);

// Rota inicial
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Finance API está funcionando',
    version: '1.0.0'
  });
});

// Rota de Health Check
app.get('/health', async (req, res) => {
  try {
    const rabbitMQHealth = await checkRabbitMQHealth();
    
    res.status(200).json({
      status: 'success',
      services: {
        api: true,
        database: {
          connected: true,
          name: 'AgileDB'
        },
        rabbitmq: rabbitMQHealth
      },
      timestamp: new Date('2024-12-13T23:03:16Z').toISOString()
    });
  } catch (error) {
    logger.error('Erro no health check', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Falha na verificação de saúde dos serviços'
    });
  }
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
    reason: reason ? reason.toString() : 'Motivo desconhecido',
    stack: reason instanceof Error ? reason.stack : 'Sem stack trace',
    promiseInfo: promise ? promise.toString() : 'Sem informações da promise'
  });
});

// Adicionar teste de conexão com banco de dados
async function testDatabaseConnection() {
    try {
        const result = await systemDatabase.testConnection();
        logger.info('Teste de conexão com banco de dados', result);
    } catch (error) {
        logger.error('Falha no teste de conexão com banco de dados', { 
            errorMessage: error.message,
            errorStack: error.stack
        });
    }
}

// Função de inicialização
async function startServer() {
  try {
    // Executar migrações do banco
    const config = {
      database: 'system',
      pool: systemDatabase.pool,
      migrationsPath: './src/migrations/system'
    };

    console.log('Iniciando migrações com config:', config);
    await runMigrations(config);

    // Iniciar servidor Express
    app.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT}`);
    });

    // Configurar conexão com RabbitMQ
    await createRabbitMQConnection();
    await checkRabbitMQHealth();
  } catch (error) {
    logger.error('Falha ao iniciar o servidor', { error: error.message || error });
    process.exit(1);
  }
}

// Iniciar o servidor
startServer();

module.exports = app;
