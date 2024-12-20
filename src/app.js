const express = require('express');
const cors = require('cors');
const { logger } = require('./middlewares/logger');
const tasksWorker = require('./workers/tasksWorker');
const boletoRoutes = require('./modules/boletos/boleto.routes');
const docsRoutes = require('./routes/docs.routes');

const app = express();

// Configurações básicas
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

// Rotas da API
app.use('/boletos', boletoRoutes);
app.use('/api/docs', docsRoutes);

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

// Inicia o worker de processamento de tarefas
tasksWorker.start().catch(error => {
    logger.error('Erro ao iniciar worker de tarefas', {
        error: error.message
    });
});

module.exports = app;
