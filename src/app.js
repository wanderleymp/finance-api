const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { errorHandler } = require('./middlewares/errorHandler');
const { authMiddleware } = require('./middlewares/auth');
const { logger } = require('./middlewares/logger');

// Importando rotas dos módulos
const authRoutes = require('./modules/auth/auth.routes');
const boletoRoutes = require('./modules/boletos/boleto.routes');
const healthRoutes = require('./modules/health/health.routes');
const movementRoutes = require('./modules/movements/movement.module');
const userRoutes = require('./modules/users/user.routes');

const app = express();

// Configurações básicas
app.use(helmet());
app.use(cors());
app.use(express.json());

// Middleware de log
app.use((req, res, next) => {
    logger.info('Nova requisição', {
        method: req.method,
        url: req.url,
        ip: req.ip
    });
    next();
});

// Rotas públicas
app.use('/auth', authRoutes);
app.use('/health', healthRoutes);

// Middleware de autenticação
app.use(authMiddleware);

// Rotas autenticadas
app.use('/boletos', boletoRoutes);
app.use('/movements', movementRoutes);
app.use('/users', userRoutes);

// Tratamento de erros global
app.use(errorHandler);

module.exports = app;
