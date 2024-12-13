const { logger } = require('../middlewares/logger');

function handleResponse(res, data, statusCode = 200) {
    res.status(statusCode).json({
        status: 'success',
        data
    });
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
