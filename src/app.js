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
const MovementRepository = require('./modules/movements/movement.repository');
const PersonRepository = require('./modules/persons/person.repository');
const MovementTypeRepository = require('./modules/movement-types/movement-type.repository');
const MovementStatusRepository = require('./modules/movement-statuses/movement-status.repository');
const PaymentMethodRepository = require('./modules/payment-methods/payment-method.repository');
const InstallmentRepository = require('./modules/installments/installment.repository');
const PersonContactRepository = require('./modules/person-contacts/person-contact.repository');
const BoletoRepository = require('./modules/boletos/boleto.repository');
const MovementPaymentRepository = require('./modules/movement-payments/movement-payment.repository');
const MovementItemRepository = require('./modules/movement-items/movement-item.repository');
const ServiceRepository = require('./modules/services/service.repository');
const LicenseRepository = require('./repositories/licenseRepository');
const MovementPaymentService = require('./modules/movement-payments/movement-payment.service');
const InstallmentService = require('./modules/installments/installment.service');
const BoletoService = require('./modules/boletos/boleto.service');
const NfseService = require('./modules/nfse/nfse.service');
const BillingMessageService = require('./modules/messages/billing/billing-message.service');
const TaskService = require('./modules/tasks/services/task.service');
const TaskRepository = require('./modules/tasks/repositories/task.repository');
const N8nService = require('./services/n8n.service');
const ContractGroupModule = require('./modules/contract-groups/contract-group.module');
const ContractMovementModule = require('./modules/contract-movements/contract-movement.module');
const ContractAdjustmentHistoryModule = require('./modules/contract-adjustment-history/contract-adjustment-history.module');

const movementDependencies = {
    movementRepository: new MovementRepository(),
    personRepository: new PersonRepository(),
    movementTypeRepository: new MovementTypeRepository(),
    movementStatusRepository: new MovementStatusRepository(),
    paymentMethodRepository: new PaymentMethodRepository(),
    installmentRepository: new InstallmentRepository(),
    movementPaymentService: new MovementPaymentService({
        movementPaymentRepository: new MovementPaymentRepository(),
        installmentRepository: new InstallmentRepository(),
        boletoService: new BoletoService({
            boletoRepository: new BoletoRepository(),
            n8nService: N8nService,
            taskService: new TaskService({
                taskRepository: new TaskRepository()
            })
        })
    }),
    personContactRepository: new PersonContactRepository(),
    boletoRepository: new BoletoRepository(),
    boletoService: new BoletoService({
        boletoRepository: new BoletoRepository(),
        n8nService: N8nService,
        taskService: new TaskService({
            taskRepository: new TaskRepository()
        })
    }),
    movementPaymentRepository: new MovementPaymentRepository(),
    installmentService: new InstallmentService(),
    licenseRepository: new LicenseRepository(),
    movementItemRepository: new MovementItemRepository(),
    nfseService: new NfseService(),
    serviceRepository: new ServiceRepository(),
    billingMessageService: new BillingMessageService()
};

const MovementService = require('./modules/movements/movement.service');
const movementService = new MovementService(movementDependencies);
movementDependencies.movementService = movementService;

const movementRoutes = require('./modules/movements/movement.routes');
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
const servicesRoutes = require('./modules/services/service.routes');
const invoicesModule = require('./modules/invoices/invoice.module');
const invoiceEventModule = require('./modules/invoice-events/invoice-event.module');
const NfseController = require('./modules/nfse/nfse.controller');
const nfseController = new NfseController(new (require('./modules/nfse/nfse.service'))());
const nfseRoutes = require('./modules/nfse/nfse.routes')(nfseController);

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

// Middleware de log de CORS
app.use((req, res, next) => {
    logger.info('Detalhes de CORS', {
        origin: req.headers.origin,
        method: req.method,
        path: req.path,
        headers: {
            origin: req.headers.origin,
            'access-control-request-method': req.headers['access-control-request-method'],
            'access-control-request-headers': req.headers['access-control-request-headers']
        }
    });
    next();
});

// Debug de rotas
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

// Adicionar log de todas as rotas registradas
const _use = app.use;
app.use = function(route, handler) {
    logger.info(`Registrando rota: ${route}`);
    return _use.apply(this, arguments);
};

// Configurações básicas
app.use(cors({
    origin: function(origin, callback){
        // Permitir requisições sem origem (como mobile ou curl)
        if(!origin) return callback(null, true);
        
        // Lista de origens permitidas
        const allowedOrigins = [
            'https://dev.agilefinance.com.br', 
            'https://api.agilefinance.com.br', 
            'https://app.agilefinance.com.br',  
            /^http:\/\/localhost:\d+$/,  // Qualquer porta localhost
            /^http:\/\/127\.0\.0\.1:\d+$/ // Qualquer porta 127.0.0.1
        ];

        // Verifica se a origem está na lista
        const isAllowed = allowedOrigins.some(allowed => {
            if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
            return allowed === origin;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('CORS não permitido'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false
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
    const startTime = Date.now();
    
    logger.info('Nova requisição recebida', {
        method: req.method,
        path: req.path,
        query: req.query,
        headers: req.headers,
        body: req.body,
        url: req.url,
        originalUrl: req.originalUrl,
        baseUrl: req.baseUrl,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    // Captura a resposta
    const oldSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - startTime;
        
        logger.info('Resposta enviada', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            body: typeof data === 'string' ? data : JSON.stringify(data),
            timestamp: new Date().toISOString()
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

// Middleware de autenticação para todas as rotas protegidas
app.use(authMiddleware);

// Registra o módulo de tasks e seus auxiliares primeiro
taskModule.register(app);
taskTypesModule.register(app);
taskDependenciesModule.register(app);
taskLogsModule.register(app);

// Obtém os serviços do TaskModule
const taskService = app.get('taskService');
const taskWorker = app.get('taskWorker');

// Registra o módulo de boletos depois que o taskService estiver disponível
app.use('/boletos', boletoModule(app));

// Registra o módulo de mensagens depois que o TaskModule estiver registrado
const messagesModuleInstance = new MessagesModule(app, {
    taskService,
    taskWorker
});
messagesModuleInstance.initialize().catch(error => {
    logger.error('Erro ao inicializar módulo de mensagens', {
        error: error.message,
        stack: error.stack
    });
});

// Registra outros módulos (que precisam de autenticação)
const userModule = require('./modules/user/user.module');
userModule.register(app);

const { PaymentMethodModule } = require('./modules/payment-methods/payment-method.module');
PaymentMethodModule.register(app);

app.use('/movements', movementRoutes(movementDependencies));
app.use('/movement-payments', movementPaymentRoutes);
app.use('/addresses', addressRoutes);
ContactModule.register(app);
PersonContactModule.registerRoutes(app);
PersonDocumentModule.register(app);
PersonModule.register(app);
ItemModule.register(app);

// Registra o módulo de itens de movimentação
const movementItemModule = new MovementItemModule();
app.use('/movement-items', movementItemModule.getRouter());

// Middleware para redirecionar /instalments para /installments
app.use((req, res, next) => {
    if (req.path === '/instalments') {
        return res.redirect('/installments');
    }
    next();
});

// Middleware para redirecionar /nfse para /nfses
app.use((req, res, next) => {
    if (req.path === '/nfse') {
        return res.redirect('/nfses');
    }
    next();
});

// Configurar rotas de parcelas - remover duplicação
app.use('/installments', InstallmentModule(app));

// Registra o módulo de NFSes
app.use('/nfses', nfseRoutes);

// Registra o módulo de serviços
app.use('/services', servicesRoutes);

// Registra os módulos de invoice e invoice events
invoiceEventModule.register(app);
invoicesModule.register(app);

// Adicionar importação de rotas de contract-groups
const ContractGroupRoutes = require('./modules/contract-groups/contract-group.routes');
const ContractMovementRoutes = require('./modules/contract-movements/contract-movement.routes');

// Adicionar rotas de contratos recorrentes
const contractRecurringRoutes = require('./modules/contracts-recurring/contract-recurring.module');
contractRecurringRoutes(app);

// Adicionar rotas de contract-groups e contract-movements
ContractGroupRoutes(app);
ContractMovementRoutes(app);

// Adicionar rotas de histórico de ajuste de contrato
const ContractAdjustmentHistoryRoutes = require('./modules/contract-adjustment-history/contract-adjustment-history.module');
ContractAdjustmentHistoryRoutes(app);

// Rota 404 para capturar requisições não encontradas
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

// Middleware de tratamento de erros
app.use(errorHandler);

module.exports = app;
