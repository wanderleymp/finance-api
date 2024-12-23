const rateLimit = require('express-rate-limit');
const { logger } = require('../logger');

const loginLimiter = rateLimit({
    windowMs: process.env.NODE_ENV === 'development' 
        ? 1 * 60 * 1000  // 1 minuto em desenvolvimento
        : process.env.LOGIN_BLOCK_DURATION * 60 * 1000,
    max: process.env.NODE_ENV === 'development'
        ? 100  // 100 tentativas em desenvolvimento
        : process.env.MAX_LOGIN_ATTEMPTS,
    message: {
        status: 'error',
        message: 'Muitas tentativas de login. Tente novamente mais tarde.'
    },
    handler: (req, res) => {
        logger.warn('Rate limit excedido', {
            ip: req.ip,
            path: req.path,
            environment: process.env.NODE_ENV
        });
        res.status(429).json({
            status: 'error',
            message: 'Muitas tentativas de login. Tente novamente mais tarde.'
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Configuração para trabalhar com proxy
    trustProxy: true,
    // Usar X-Forwarded-For para o IP real em produção, IP direto em desenvolvimento
    keyGenerator: function (req) {
        if (process.env.NODE_ENV === 'development') {
            return 'dev-environment'; // Uma única chave para todo ambiente de desenvolvimento
        }
        return req.headers['x-forwarded-for'] || req.ip;
    }
});

module.exports = { loginLimiter };
