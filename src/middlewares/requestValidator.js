const Joi = require('joi');
const { logger } = require('./logger');

function validateRequest(schema, property = 'body') {
    return (req, res, next) => {
        try {
            logger.debug('Validando requisição', {
                property,
                requestData: req[property]
            });

            if (!schema || typeof schema.validate !== 'function') {
                logger.error('Schema de validação inválido');
                return res.status(500).json({
                    success: false,
                    error: 'Erro interno de validação'
                });
            }

            const { error } = schema.validate(req[property], {
                abortEarly: false,
                allowUnknown: true,
                stripUnknown: true
            });

            if (error) {
                logger.error('Erro de validação', {
                    errorDetails: error.details,
                    errorMessage: error.message
                });

                return res.status(400).json({
                    success: false,
                    error: 'Erro de validação',
                    details: error.details.map(err => ({
                        message: err.message,
                        path: err.path
                    }))
                });
            }

            next();
        } catch (err) {
            logger.error('Erro ao validar requisição', {
                error: err.message,
                stack: err.stack
            });
            
            return res.status(500).json({
                success: false,
                error: 'Erro interno ao validar requisição'
            });
        }
    };
}

module.exports = { validateRequest };
