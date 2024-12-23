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
const healthRoutes = require('./modules/health/health.routes');
const boletoRoutes = require('./modules/boletos/boleto.routes');
const movementRoutes = require('./modules/movements/movement.module');
const movementPaymentRoutes = require('./modules/movement-payments/movement-payment.module');
const paymentMethodRoutes = require('./modules/payment-methods/payment-method.module');
const addressRoutes = require('./modules/addresses/address.module');
const ContactModule = require('./modules/contacts/contact.module');
const PersonContactModule = require('./modules/person-contacts/person-contact.module');
const PersonDocumentModule = require('./modules/person-documents/person-document.module');
const PersonModule = require('./modules/persons/person.module');
const ItemModule = require('./modules/items/item.module');
const MovementItemModule = require('./modules/movement-items/movement-item.module');
const InstallmentModule = require('./modules/installments/installment.module');

const app = express();

// Configurações do Swagger UI
const swaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
        urls: [
            {
                url: '/api-docs.json',
                name: 'Specification'
            }
        ]
    }
};

// Configuração do Redis
(async () => {
    try {
        await redisWrapper.connect();
    } catch (error) {
        logger.warn('Redis não está disponível, sistema operará sem cache', { error: error.message });
    }
})();

// Middleware de logging para todas as requisições
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
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use('/static', express.static(path.join(__dirname, 'public')));

// Middleware de logging para dados da requisição
app.use((req, res, next) => {
    if (req.body && Object.keys(req.body).length > 0) {
        logger.info('Validando requisição', {
            property: 'body',
            requestData: req.body
        });
    }
    next();
});

// Setup do Swagger
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Setup do Swagger UI
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Rotas públicas
app.use('/health', healthRoutes);

// Registra módulos
const authModule = require('./modules/auth/auth.module');
authModule.register(app);

// Middleware de autenticação
app.use(authMiddleware);

// Registra outros módulos (que precisam de autenticação)
const userModule = require('./modules/user/user.module');
userModule.register(app);

app.use('/boletos', boletoRoutes);
app.use('/movements', movementRoutes);
app.use('/movement-payments', movementPaymentRoutes);
app.use('/payment-methods', paymentMethodRoutes);
app.use('/addresses', addressRoutes);
ContactModule.register(app);
PersonContactModule.registerRoutes(app);
PersonDocumentModule.register(app);
PersonModule.register(app);
ItemModule.register(app);

// Registra o módulo de itens de movimentação
const movementItemModule = new MovementItemModule();
app.use('/movement-items', movementItemModule.getRouter());

InstallmentModule.register(app);

// Rota 404 para capturar requisições não encontradas
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

// Middleware de tratamento de erros
app.use(errorHandler);

module.exports = app;
