const { logger } = require('./logger');

/**
 * Middleware para validação de requisições usando Joi
 */
async function validateRequest(req, property, schema) {
    try {
        const requestData = req[property];
        logger.info('Validando requisição', { property, requestData });

        const { error, value } = schema.validate(requestData);
        if (error) {
            error.status = 400;
            throw error;
        }

        // Atualiza os dados da requisição com os valores validados/transformados
        req[property] = value;
    } catch (error) {
        logger.error('Erro na validação da requisição', {
            error: error.message,
            property,
            requestData: req[property]
        });
        throw error;
    }
}

module.exports = {
    validateRequest
};
