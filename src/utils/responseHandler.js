const { logger } = require('../middlewares/logger');

function handleResponse(res, statusCode = 200, data) {
    res.status(statusCode).json(data);
}

function handleError(res, error) {
    logger.error('Erro na requisição', { 
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        errorCode: error.code,
        errorStatusCode: error.statusCode
    });
    
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Erro interno do servidor',
        details: {
            name: error.name,
            code: error.code
        }
    });
}

module.exports = {
    handleResponse,
    handleError
};
