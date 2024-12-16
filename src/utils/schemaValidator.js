const Joi = require('joi');

class SchemaValidatorError extends Error {
    constructor(message, details) {
        super(message);
        this.name = 'SchemaValidatorError';
        this.details = details;
        this.statusCode = 400;
    }
}

const schemaValidator = {
    validateSchema: async (schema, data) => {
        try {
            const { error, value } = schema.validate(data, { 
                abortEarly: false,  // Retorna todos os erros de uma vez
                convert: true,      // Converte os tipos automaticamente
                stripUnknown: true  // Remove propriedades desconhecidas
            });

            if (error) {
                const formattedErrors = error.details.map(detail => ({
                    message: detail.message,
                    path: detail.path,
                    type: detail.type
                }));

                throw new SchemaValidatorError('Erro de validação', formattedErrors);
            }

            return value;
        } catch (err) {
            throw err;
        }
    }
};

module.exports = schemaValidator;
