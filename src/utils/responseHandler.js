const { logger } = require('../middlewares/logger');

function handleResponse(res, statusCode = 200, data) {
    res.status(statusCode).json(data);
}

function handleError(res, error) {
    logger.error('Erro na requisição', { error: error.message });
    
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Erro interno do servidor'
    });
}

module.exports = {
    handleResponse,
    handleError
};
