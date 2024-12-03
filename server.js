const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/swagger');
const routes = require('./src/routes');
const logger = require('./config/logger');
const dotenv = require('dotenv');

// Carrega variáveis de ambiente
dotenv.config();

// Manipuladores de erro não tratado
process.on('uncaughtException', (error) => {
    console.error('=== ERRO NÃO TRATADO ===');
    console.error('Erro:', error);
    console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (error) => {
    console.error('=== PROMISE REJEITADA NÃO TRATADA ===');
    console.error('Erro:', error);
    console.error('Stack:', error.stack);
});

// Debug: Verifica variáveis de ambiente críticas
console.log('=== VERIFICAÇÃO DE AMBIENTE ===');
console.log('JWT_SECRET definido:', !!process.env.JWT_SECRET);
console.log('DATABASE_CONNECTION_URI definido:', !!process.env.DATABASE_CONNECTION_URI);

const app = express();

// CORS totalmente liberado
app.use(cors({
    origin: '*',
    methods: '*',
    allowedHeaders: '*',
    credentials: true
}));

// Configuração do parser de JSON
app.use(express.json());

// Configuração do Swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware de logging
app.use((req, res, next) => {
    const start = Date.now();
    
    logger.info('Nova requisição:', {
        method: req.method,
        url: req.url,
        path: req.path,
        body: req.body,
        ip: req.ip,
        user_agent: req.get('user-agent')
    });

    // Intercepta a resposta para logar a duração
    const oldSend = res.send;
    res.send = function(data) {
        const duration = Date.now() - start;
        
        logger.info('Resposta enviada:', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`
        });
        
        oldSend.apply(res, arguments);
    };

    next();
});

// Rotas
app.use('/', routes);

// Middleware de erro
app.use((err, req, res, next) => {
    logger.error('Erro não tratado:', {
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.url
    });
    res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Servidor rodando na porta ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Erro não capturado:', {
        error: err.message,
        stack: err.stack
    });
    process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
    logger.error({
        type: 'UNHANDLED_REJECTION',
        error: err.message,
        stack: err.stack
    });
    process.exit(1);
});
