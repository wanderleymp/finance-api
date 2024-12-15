const express = require('express');
const cors = require('cors');
const { logger } = require('./middlewares/logger');
const routes = require('./routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

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

// Rotas centralizadas
app.use('/', routes);

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

// Rota 404 para endpoints não encontrados
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado'
    });
});

module.exports = app;
