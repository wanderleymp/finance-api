const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { errorHandler } = require('./middlewares/errorHandler');
const { authMiddleware } = require('./middlewares/auth');
const { logger } = require('./middlewares/logger');
const path = require('path');

// Importando rotas dos módulos
const healthRoutes = require('./modules/health/health.routes');
const authModule = require('./modules/auth/auth.module');
const boletoModule = require('./modules/boletos/boleto.module');
const movementRoutes = require('./modules/movements/movement.module');
const movementPaymentRoutes = require('./modules/movement-payments/movement-payment.module');
const paymentMethodModule = require('./modules/payment-methods/payment-method.module');
const addressRoutes = require('./modules/addresses/address.module');
const ContactModule = require('./modules/contacts/contact.module');
const PersonContactModule = require('./modules/person-contacts/person-contact.module');
const PersonDocumentModule = require('./modules/person-documents/person-document.module');
const PersonModule = require('./modules/persons/person.module');
const ItemModule = require('./modules/items/item.module');
const MovementItemModule = require('./modules/movement-items/movement-item.module');
const InstallmentModule = require('./modules/installments/installment.module');
const taskModule = require('./modules/tasks/task.module');
const taskTypesModule = require('./modules/tasktypes/tasktypes.module');
const taskDependenciesModule = require('./modules/taskdependencies/taskdependencies.module');
const taskLogsModule = require('./modules/tasklogs/tasklogs.module');
const MessagesModule = require('./modules/messages/messages.module');

const app = express();

// Middleware de logging para todas as requisições
app.use((req, res, next) => {
    logger.info('Nova requisição recebida', {
        method: req.method,
        url: req.url,
        path: req.path,
        originalUrl: req.originalUrl,
        ip: req.ip,
        headers: req.headers
    });
    next();
});

// Configurações básicas
app.use(cors({
    origin: ['https://dev.agilefinance.com.br', 'https://api.agilefinance.com.br', 'http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: false
    })
);

app.use(express.json());

// Log de todas as requisições
app.use((req, res, next) => {
    logger.info('Nova requisição recebida', {
        method: req.method,
        path: req.path,
        query: req.query,
        headers: req.headers,
        body: req.body,
        url: req.url,
        originalUrl: req.originalUrl,
        baseUrl: req.baseUrl
    });

    // Captura a resposta
    const oldSend = res.send;
    res.send = function (data) {
        logger.info('Resposta enviada', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            body: typeof data === 'string' ? data : JSON.stringify(data)
        });
        return oldSend.apply(res, arguments);
    };

    next();
});

// Setup do Swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas públicas (não precisam de autenticação)
app.use('/health', healthRoutes);
authModule.register(app); // Registra rotas de autenticação antes do middleware

// Registra o módulo de tasks e seus auxiliares primeiro
taskModule.register(app);
taskTypesModule.register(app);
taskDependenciesModule.register(app);
taskLogsModule.register(app);

// Registra o módulo de mensagens depois que o taskModule estiver registrado
const messagesModuleInstance = new MessagesModule(app);
messagesModuleInstance.initialize().catch(error => {
    logger.error('Erro ao inicializar módulo de mensagens', {
        error: error.message,
        stack: error.stack
    });
});

// Middleware de autenticação para todas as outras rotas
app.use(authMiddleware);

// Registra outros módulos (que precisam de autenticação)
const userModule = require('./modules/user/user.module');
userModule.register(app);

app.use('/boletos', boletoModule);
app.use('/movements', movementRoutes);
app.use('/movement-payments', movementPaymentRoutes);
app.use('/payment-method', paymentMethodModule.getRouter());
app.use('/addresses', addressRoutes);
ContactModule.register(app);
PersonContactModule.registerRoutes(app);
PersonDocumentModule.register(app);
PersonModule.register(app);
ItemModule.register(app);

// Registra o módulo de itens de movimentação
const movementItemModule = new MovementItemModule();
app.use('/movement-items', movementItemModule.getRouter());

// Registra o módulo de parcelas
const installmentModule = require('./modules/installments/installment.module');
installmentModule.register(app);

// Rota 404 para capturar requisições não encontradas
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

// Middleware de tratamento de erros
app.use(errorHandler);

module.exports = app;
