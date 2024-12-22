const { logger } = require('../middlewares/logger');

function handleResponse(res, data, statusCode = 200) {
    if (!res || typeof res.status !== 'function') {
        console.error('Invalid response object:', res);
        throw new Error('Invalid response object');
    }
    return res.status(statusCode).json({
        data: data,
        total: data.total || null,
        page: data.page || 1,
        limit: data.limit || 10
    });
}

function handleError(res, error, statusCode = 500) {
    if (!res || typeof res.status !== 'function') {
        console.error('Invalid response object:', res);
        return null;
    }

    logger.error('Erro na requisição', { 
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        errorCode: error.code,
        errorStatusCode: error.statusCode
    });
    
    return res.status(statusCode).json({
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
