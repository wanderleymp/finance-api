const express = require('express');
const app = express();
const dotenv = require('dotenv');
const logger = require('./config/logger');
const setupSwagger = require('./config/swagger');
const cors = require('cors');
dotenv.config();

// Configuração do CORS com logs detalhados
const corsOptions = {
    origin: function (origin, callback) {
        // Lista de origens permitidas
        const allowedOrigins = [
            'https://zp1v56uxy8rdx5ypatb0ockcb9tr6a-oci3--5173--d3acb9e1.local-credentialless.webcontainer-api.io',
            'https://agilefinance.com.br',
            'http://localhost:5173',  // Para desenvolvimento local
            'http://localhost:3000'   // Para desenvolvimento local
        ];
        
        console.log('=== CORS REQUEST ===');
        console.log('Origin:', origin);
        
        // Permite requisições sem origin (como mobile apps ou Postman)
        if (!origin) {
            console.log('Permitindo requisição sem origem (provavelmente Postman ou similar)');
            return callback(null, true);
        }
        
        // Verifica se a origem está na lista de permitidas
        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log('Origem permitida:', origin);
            callback(null, true);
        } else {
            console.log('Origem bloqueada:', origin);
            callback(new Error('Não permitido pelo CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,  // Permite envio de cookies e credenciais
    maxAge: 86400,  // Cache das preflight requests por 24 horas
    optionsSuccessStatus: 200 // Para compatibilidade com alguns browsers
};

// Aplica o CORS antes de todas as rotas
app.use(cors(corsOptions));

// Middleware para logging de todas as requisições
app.use((req, res, next) => {
    console.log('=== NOVA REQUISIÇÃO ===');
    console.log('Método:', req.method);
    console.log('URL:', req.url);
    console.log('Origin:', req.headers.origin);
    console.log('Headers:', req.headers);
    next();
});

// Middleware
app.use(express.json());

// Middleware de logging melhorado
app.use((req, res, next) => {
    const start = Date.now();
    
    // Logging da requisição
    logger.info({
        type: 'REQUEST',
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        headers: req.headers
    });

    // Intercepta a resposta
    const oldSend = res.send;
    res.send = function(data) {
        const duration = Date.now() - start;
        
        // Logging da resposta
        logger.info({
            type: 'RESPONSE',
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            response: data
        });
        
        oldSend.apply(res, arguments);
    };

    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error({
        type: 'ERROR',
        method: req.method,
        path: req.path,
        error: err.message,
        stack: err.stack
    });
    
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: err.message
    });
});

// Configurar Swagger
setupSwagger(app);

// Rotas
const routes = require('./src/routes/index');
app.use('/', routes);

// Porta
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    logger.info({
        type: 'SERVER_START',
        message: `Servidor rodando na porta ${PORT}`,
        port: PORT,
        nodeEnv: process.env.NODE_ENV
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error({
        type: 'UNCAUGHT_EXCEPTION',
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
