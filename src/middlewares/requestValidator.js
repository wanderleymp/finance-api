const { logger } = require('./logger');

function validateRequest(schema, property) {
    return (req, res, next) => {
        // Se a propriedade não existir, crie um objeto vazio
        const propertyToValidate = req[property] || {};

        logger.info('Validando request', { 
            property, 
            schema: schema.describe(),
            reqProperty: propertyToValidate 
        });

        const { error } = schema.validate(propertyToValidate);
        
        if (error) {
            logger.error('Erro de validação', { 
                errorDetails: error.details 
            });

            return res.status(400).json({
                status: 'error',
                message: error.details[0].message
            });
        }
        
        next();
    };
}

module.exports = { validateRequest };
