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
const paymentMethodRoutes = require('./modules/payment-methods/payment-method.module');
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
const messagesModule = require('./modules/messages/chat.module');
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
    origin: ['https://dev.agilefinance.com.br', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: false
    })
);

app.use(express.json());

// Setup do Swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas públicas (não precisam de autenticação)
app.use('/health', healthRoutes);
authModule.register(app); // Registra rotas de autenticação antes do middleware

// Middleware de autenticação para todas as outras rotas
app.use(authMiddleware);

// Registra outros módulos (que precisam de autenticação)
const userModule = require('./modules/user/user.module');
userModule.register(app);

boletoModule.register(app);
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

// Registra o módulo de parcelas
const installmentModule = require('./modules/installments/installment.module');
installmentModule.register(app);

// Registra o módulo de tasks e seus auxiliares
taskModule.register(app);
taskTypesModule.register(app);
taskDependenciesModule.register(app);
taskLogsModule.register(app);

// Registra o módulo de mensagens
const messagesModuleInstance = new MessagesModule(app);
messagesModuleInstance.initialize().catch(error => {
    logger.error('Erro ao inicializar módulo de mensagens', {
        error: error.message,
        stack: error.stack
    });
});

// Rota 404 para capturar requisições não encontradas
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

// Middleware de tratamento de erros
app.use(errorHandler);

module.exports = app;
