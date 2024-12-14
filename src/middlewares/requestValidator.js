const { logger } = require('./logger');

function validateRequest(schema, property = null) {
    return (req, res, next) => {
        try {
            // Log detalhado para depuração NÍVEL 2
            logger.info(' MIDDLEWARE: Início da validação', {
                method: req.method,
                path: req.path,
                params: req.params,
                body: req.body,
                query: req.query
            });

            // Determinar a propriedade correta para validação
            const propertyToValidate = req[property] || {};

            // Usar o schema correto (params do schema)
            const schemaToValidate = schema[property] || schema;

            // Validação
            let error;
            try {
                const validationResult = schemaToValidate.validate(propertyToValidate);
                error = validationResult.error;
            } catch (validationError) {
                logger.error(' MIDDLEWARE: Erro durante validação', {
                    errorMessage: validationError.message,
                    errorStack: validationError.stack
                });
                error = validationError;
            }
            
            if (error) {
                logger.error(' MIDDLEWARE: Erro de validação', { 
                    errorDetails: error.details ? error.details[0].message : error.message
                });

                return res.status(400).json({
                    status: 'error',
                    message: error.details ? error.details[0].message : error.message
                });
            }
            
            next();
        } catch (err) {
            logger.error(' MIDDLEWARE: Erro interno de validação', {
                error: err.message,
                errorStack: err.stack
            });
            res.status(500).json({
                status: 'error',
                message: 'Erro interno de validação'
            });
        }
    };
}

module.exports = { validateRequest };
