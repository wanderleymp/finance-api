const rateLimit = require('express-rate-limit');
const { logger } = require('../logger');

const loginLimiter = rateLimit({
    windowMs: process.env.LOGIN_BLOCK_DURATION * 60 * 1000,
    max: process.env.MAX_LOGIN_ATTEMPTS,
    message: {
        status: 'error',
        message: 'Muitas tentativas de login. Tente novamente mais tarde.'
    },
    handler: (req, res) => {
        logger.warn('Rate limit excedido', {
            ip: req.ip,
            path: req.path
        });
        res.status(429).json({
            status: 'error',
            message: 'Muitas tentativas de login. Tente novamente mais tarde.'
        });
    }
});

module.exports = { loginLimiter };
