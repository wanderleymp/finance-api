const express = require('express');
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

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração de CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173', 
    'http://localhost:5174'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 3600
}));

// Middleware global
app.use(httpLogger);

// Middleware para log de requisições
app.use((req, res, next) => {
  logger.info('Detalhes da requisição', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    query: req.query,
    body: req.body,
    params: req.params
  });
  next();
});

// Middleware para garantir req.query
app.use((req, res, next) => {
  if (!req.query) {
    req.query = {};
  }
  next();
});

// Importar rotas
const roadmapRoutes = require('./routes/roadmapRoutes');
const personRoutes = require('./routes/personRoutes');
const personDocumentRoutes = require('./routes/personDocumentRoutes');
const contactRoutes = require('./routes/contactRoutes');
const personContactRoutes = require('./routes/personContactRoutes');
const personAddressRoutes = require('./routes/personAddressRoutes');
const addressRoutes = require('./routes/addressRoutes');
const licenseRoutes = require('./routes/licenseRoutes');
const personLicenseRoutes = require('./routes/personLicenseRoutes');
const systemConfigRoutes = require('./routes/systemConfigRoutes');
const userRoutes = require('./routes/userRoutes');
const movementTypeRoutes = require('./routes/movementTypeRoutes');

app.use('/roadmap', roadmapRoutes);
app.use('/persons', personRoutes);
app.use('/person-documents', personDocumentRoutes);
app.use('/contacts', contactRoutes);
app.use('/person-contacts', personContactRoutes);
app.use('/person-addresses', personAddressRoutes);
app.use('/addresses', addressRoutes);
app.use('/licenses', licenseRoutes);
app.use('/person-licenses', personLicenseRoutes);
app.use('/api/system', systemConfigRoutes(systemDatabase.pool));
app.use('/users', userRoutes);
app.use('/movement-types', movementTypeRoutes);

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
    // Remover execução de migrações
    
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
