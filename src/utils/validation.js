const Joi = require('joi');

/**
 * Valida um objeto usando um schema Joi
 * @param {Object} data - Dados a serem validados
 * @param {Object} schema - Schema Joi para validação
 * @returns {Object} Objeto com erro (se houver) e valor validado
 */
function validate(data, schema) {
    if (!schema) {
        return { value: data };
    }

    const options = {
        abortEarly: false, // Retorna todos os erros, não apenas o primeiro
        allowUnknown: true, // Permite campos não especificados no schema
        stripUnknown: true // Remove campos não especificados no schema
    };

    const { error, value } = schema.validate(data, options);

    if (error) {
        const errorDetails = error.details.map(detail => ({
            message: detail.message,
            path: detail.path,
            type: detail.type
        }));

        return {
            error: {
                message: 'Erro de validação',
                details: errorDetails
            }
        };
    }

    return { value };
}

module.exports = {
    validate
};
