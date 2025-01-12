/**
 * Gera uma resposta de sucesso padrão para APIs
 * @param {Object} res - Objeto de resposta do Express
 * @param {number} statusCode - Código de status HTTP
 * @param {Object|Array} data - Dados a serem enviados na resposta
 * @param {string} [message='Operação realizada com sucesso'] - Mensagem de sucesso
 * @returns {Object} Resposta HTTP com dados e status
 */
const successResponse = (res, statusCode = 200, data = null, message = 'Operação realizada com sucesso') => {
    return res.status(statusCode).json(data);
};

/**
 * Gera uma resposta de erro padrão para APIs
 * @param {Object} res - Objeto de resposta do Express
 * @param {number} statusCode - Código de status HTTP
 * @param {string} message - Mensagem de erro
 * @param {Object} [error=null] - Detalhes adicionais do erro
 * @returns {Object} Resposta HTTP com erro e status
 */
const errorResponse = (res, statusCode = 500, message = 'Erro interno do servidor', error = null) => {
    return res.status(statusCode).json({
        success: false,
        message,
        error
    });
};

module.exports = {
    successResponse,
    errorResponse
};
