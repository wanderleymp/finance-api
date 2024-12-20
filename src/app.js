const express = require('express');
const cors = require('cors');
const { logger } = require('./middlewares/logger');
const salesRoutes = require('./routes/salesRoutes');

const app = express();

// Middlewares
const corsOptions = {
    origin: [
        process.env.FRONTEND_URL || '*', 
        'https://api.agilefinance.com.br',
        'http://api.agilefinance.com.br'
    ], 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
    allowedHeaders: ['Content-Type', 'Authorization', '*'], 
    credentials: true 
};

// Configurações básicas
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware para todas as requisições
app.use((req, res, next) => {
    logger.info('Requisição recebida', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

// Tratamento de erros global
app.use((err, req, res, next) => {
    logger.error('Erro não tratado', {
        error: err.message,
        stack: err.stack
    });

    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
    });
});

// Rotas da aplicação
app.use('/sales', salesRoutes);

// Rota 404 para endpoints não encontrados
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado'
    });
});

module.exports = app;
