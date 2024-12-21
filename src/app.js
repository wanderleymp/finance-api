const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { errorHandler } = require('./middlewares/errorHandler');
const { logger } = require('./middlewares/logger');

// Importando rotas dos módulos diretamente
const healthRoutes = require('./modules/health/health.routes');
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');

const app = express();

// Configurações básicas
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    logger.info('Requisição recebida', {
        method: req.method,
        url: req.url,
        ip: req.ip
    });
    next();
});

// Rotas dos módulos
app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

const { authMiddleware } = require('./middlewares/auth');
app.use(authMiddleware); // Aplica autenticação para todas as rotas abaixo

// Tratamento de erros global
app.use(errorHandler);

module.exports = app;
