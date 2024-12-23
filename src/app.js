const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { errorHandler } = require('./middlewares/errorHandler');
const { authMiddleware } = require('./middlewares/auth');
const { logger } = require('./middlewares/logger');
const redisWrapper = require('./config/redis');
const path = require('path');

// Importando rotas dos módulos
const authRoutes = require('./modules/auth/auth.routes');
const boletoRoutes = require('./modules/boletos/boleto.routes');
const healthRoutes = require('./modules/health/health.routes');
const movementRoutes = require('./modules/movements/movement.module');
const movementPaymentRoutes = require('./modules/movement-payments/movement-payment.module');
const paymentMethodRoutes = require('./modules/payment-methods/payment-method.module');
const userRoutes = require('./modules/users/user.routes');
const addressRoutes = require('./modules/addresses/address.module');
const ContactModule = require('./modules/contacts/contact.module');
const PersonContactModule = require('./modules/person-contacts/person-contact.module');
const PersonDocumentModule = require('./modules/person-documents/person-document.module');
const PersonModule = require('./modules/persons/person.module');
const ItemModule = require('./modules/items/item.module');
const MovementItemModule = require('./modules/movement-items/movement-item.module');

const app = express();

// Middleware de log (PRIMEIRO, antes de tudo)
app.use((req, res, next) => {
    logger.info('Nova requisição recebida', {
        method: req.method,
        url: req.url,
        path: req.path,
        originalUrl: req.originalUrl,
        ip: req.ip
    });
    next();
});

// Configurações básicas
app.use(cors());
app.use(express.json());

// Inicializa conexão com Redis
redisWrapper.connect().then(connected => {
    if (connected) {
        logger.info('Redis conectado e pronto para uso');
    } else {
        logger.warn('Redis não está disponível, sistema operará sem cache');
    }
});

// Configuração do Swagger UI
const swaggerUiOptions = {
    explorer: true,
    customSiteTitle: "Finance API Documentation",
    swaggerOptions: {
        persistAuthorization: true
    }
};

// Configuração do Helmet (com configurações seguras para o Swagger UI)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "data:"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
}));

// Rota para o Swagger JSON
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Setup do Swagger UI
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Rotas públicas
app.use('/auth', authRoutes);
app.use('/health', healthRoutes);

// Middleware de autenticação
app.use(authMiddleware);

// Rotas autenticadas
app.use('/boletos', boletoRoutes);
app.use('/movements', movementRoutes);
app.use('/movement-payments', movementPaymentRoutes);
app.use('/payment-methods', paymentMethodRoutes);
app.use('/users', userRoutes);
app.use('/addresses', addressRoutes);
ContactModule.register(app);
PersonContactModule.registerRoutes(app);
PersonDocumentModule.register(app);
PersonModule.register(app);
ItemModule.register(app);

// Registra o módulo de itens de movimentação
const movementItemModule = new MovementItemModule();
app.use(movementItemModule.getRouter());

// Rota 404 para capturar requisições não encontradas
app.use((req, res) => {
    logger.warn('Rota não encontrada', {
        method: req.method,
        url: req.url,
        path: req.path
    });
    res.status(404).json({ 
        status: 'error',
        message: 'Rota não encontrada'
    });
});

// Middleware de tratamento de erros (ÚLTIMO, depois de tudo)
app.use(errorHandler);

module.exports = app;
