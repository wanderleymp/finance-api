const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const https = require('https');
const http = require('http');

const { httpLogger, logger } = require('./middlewares/logger');
const { createRabbitMQConnection, checkRabbitMQHealth } = require('./config/rabbitmq');
const roadmapService = require('./services/roadmapService');
const { runMigrations } = require('./scripts/migrate');
const { systemDatabase } = require('./config/database');

const app = express();

// Ambiente de execução
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 3000;

// Carregar variáveis de ambiente
dotenv.config();

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração de segurança e CORS baseada no ambiente
const configureSecurityAndCORS = () => {
  if (NODE_ENV === 'development') {
    // Configurações para desenvolvimento
    logger.info('🚧 Modo de Desenvolvimento: Configurações de segurança relaxadas');
    
    // CORS permissivo para desenvolvimento
    app.use(cors({
      origin: [
        'http://localhost:5173', 
        'http://localhost:5174',
        'https://localhost:5173',
        'https://localhost:5174'
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
      maxAge: 3600
    }));

    // Desabilitar algumas proteções de segurança
    app.use((req, res, next) => {
      // Permitir conteúdo misto
      res.setHeader('Content-Security-Policy', 'upgrade-insecure-requests');
      next();
    });
  } else {
    // Configurações para produção
    logger.info('🔒 Modo de Produção: Configurações de segurança rígidas');
    
    // Helmet para segurança
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
    }));

    // CORS restrito para produção
    app.use(cors({
      origin: [
        process.env.FRONTEND_URL,
        'https://api.agilefinance.com.br',
        'http://api.agilefinance.com.br'
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }));

    // Forçar HTTPS
    app.use((req, res, next) => {
      if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(`https://${req.headers.host}${req.url}`);
      }
      next();
    });
  }
};

// Aplicar configurações de segurança e CORS
configureSecurityAndCORS();

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
const movementStatusRoutes = require('./routes/movementStatusRoutes');
const movementRoutes = require('./routes/movementRoutes');
const itemRoutes = require('./routes/itemRoutes');
const ServiceLc116Controller = require('./controllers/serviceLc116Controller');
const serviceLc116Controller = new ServiceLc116Controller();
const salesRoutes = require('./routes/salesRoutes');
const paymentMethodsRoutes = require('./routes/paymentMethodsRoutes');
const movementPaymentsRoutes = require('./routes/movementPaymentsRoutes');
const installmentRoutes = require('./routes/installmentRoutes');
const boletoRoutes = require('./routes/boletoRoutes');

const routes = require('./routes');
console.log('Rotas principais carregadas:', routes);
app.use('/', routes);

// Restaurar rotas individuais
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
app.use('/movement-status', movementStatusRoutes);
app.use('/movements', movementRoutes);
app.use('/items', itemRoutes);
app.use('/sales', salesRoutes());
app.use('/payment-methods', paymentMethodsRoutes);
app.use('/movement-payments', movementPaymentsRoutes);
app.use('/installments', installmentRoutes);
app.use('/boletos', boletoRoutes);

app.use('/service-lc116', (req, res, next) => {
  const { method } = req;

  switch (method) {
    case 'GET':
      if (req.params.id) {
        return serviceLc116Controller.show(req, res);
      }
      return serviceLc116Controller.index(req, res);
    case 'POST':
      return serviceLc116Controller.store(req, res);
    case 'PUT':
      return serviceLc116Controller.update(req, res);
    case 'DELETE':
      return serviceLc116Controller.destroy(req, res);
    default:
      return res.status(405).json({ error: 'Método não permitido' });
  }
});

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

// Função para ler o arquivo de versão
function getAppVersion() {
  try {
    const versionPath = path.resolve(__dirname, '../VERSION');
    const versionContent = fs.readFileSync(versionPath, 'utf-8');
    const versionInfo = versionContent.split('\n').reduce((acc, line) => {
      const [key, value] = line.split('=');
      acc[key] = value;
      return acc;
    }, {});
    return versionInfo;
  } catch (error) {
    console.error('Erro ao ler arquivo de versão:', error);
    return { version: 'unknown', branch: 'unknown' };
  }
}

const appVersion = getAppVersion();
console.log('DEBUG: App Version', appVersion);
logger.info(`🚀 Inicializando Finance API`, {
  version: appVersion.version,
  branch: appVersion.branch,
  buildDate: appVersion.build_date
});
console.log('DEBUG: Logger Info chamado');

// Função de inicialização do servidor
async function startServer() {
  try {
    // Criar conexão RabbitMQ
    await createRabbitMQConnection();

    // Configuração do servidor baseada no ambiente
    if (NODE_ENV === 'development') {
      // Servidor HTTP para desenvolvimento
      const server = http.createServer(app);
      server.listen(PORT, () => {
        logger.info(`🚧 Servidor de desenvolvimento rodando em http://localhost:${PORT}`);
      });
    } else {
      // Configuração de HTTPS para produção
      const httpsOptions = {
        key: fs.readFileSync(path.resolve(__dirname, '../ssl/private.key')),
        cert: fs.readFileSync(path.resolve(__dirname, '../ssl/certificate.crt'))
      };

      const server = https.createServer(httpsOptions, app);
      server.listen(PORT, () => {
        logger.info(`🔒 Servidor de produção rodando em https://localhost:${PORT}`);
      });
    }
  } catch (error) {
    logger.error('Erro ao iniciar o servidor', { error: error.message });
    process.exit(1);
  }
}

// Iniciar o servidor
startServer();

module.exports = app;
