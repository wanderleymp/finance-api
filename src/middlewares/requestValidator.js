const Joi = require('joi');
const { logger } = require('./logger');

function validateRequest(schema, property = 'body') {
    return (req, res, next) => {
        logger.debug('Validando requisição', {
            schema: schema.describe(),
            property,
            requestData: req[property]
        });

        const { error } = schema.validate(req[property]);

        if (error) {
            logger.error('Erro de validação', {
                errorDetails: error.details,
                errorMessage: error.message
            });

            return res.status(400).json({
                success: false,
                message: 'Erro de validação',
                details: error.details.map(detail => detail.message)
            });
        }

        next();
    };
}

module.exports = { validateRequest };
