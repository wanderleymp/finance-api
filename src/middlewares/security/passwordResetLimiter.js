const rateLimit = require('express-rate-limit');
const { logger } = require('../logger');

const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // limite de 3 tentativas por IP
    message: {
        status: 'error',
        message: 'Muitas tentativas de recuperação de senha. Tente novamente em 1 hora.'
    },
    handler: (req, res, next, options) => {
        logger.warn('Limite de tentativas de recuperação de senha excedido', {
            ip: req.ip,
            email: req.body.email
        });
        res.status(429).json(options.message);
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = { passwordResetLimiter };
