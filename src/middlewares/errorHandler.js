const { logger } = require('./logger');

function errorHandler(err, req, res, next) {
    // Log do erro
    logger.error('Erro na aplicação', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method
    });

    // Se for um erro de validação
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Erro de validação',
            details: err.details
        });
    }

    // Se for um erro de negócio
    if (err.name === 'BusinessError') {
        return res.status(400).json({
            error: err.message
        });
    }

    // Se for um erro de autenticação
    if (err.name === 'AuthenticationError') {
        return res.status(401).json({
            error: 'Não autorizado'
        });
    }

    // Se for um erro de banco de dados
    if (err.name === 'DatabaseError') {
        return res.status(500).json({
            error: 'Erro interno no servidor'
        });
    }

    // Para outros tipos de erro
    res.status(500).json({
        error: 'Erro interno no servidor'
    });
}

module.exports = {
    errorHandler
};
