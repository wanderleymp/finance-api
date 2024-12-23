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

/**
 * Retorna um middleware para validação de uma propriedade específica da requisição
 * @param {string} property - Propriedade da requisição a ser validada (body, params, query)
 * @param {object} schema - Schema Joi para validação
 * @returns {function} Middleware de validação
 */
function validate(property, schema) {
    return async (req, res, next) => {
        try {
            await validateRequest(req, property, schema);
            next();
        } catch (error) {
            next(error);
        }
    };
}

module.exports = {
    validateRequest,
    validate
};
