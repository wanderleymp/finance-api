const Joi = require('joi');

const serviceSchema = Joi.object({
    itemId: Joi.number().required(),
    serviceGroupId: Joi.number().optional(),
    description: Joi.string().trim().min(3).max(255).required(),
    name: Joi.string().trim().min(3).max(100).required(),
    active: Joi.boolean().default(true)
});

module.exports = {
    /**
     * Valida dados de serviço usando Joi
     * @param {Object} data - Dados do serviço
     * @returns {Object} Dados validados
     * @throws {ValidationError} Se dados inválidos
     */
    validateService: (data) => {
        const { error, value } = serviceSchema.validate(data, { 
            abortEarly: false,
            stripUnknown: true 
        });

        if (error) {
            throw new Error(`Erro de validação: ${error.details.map(d => d.message).join(', ')}`);
        }

        return value;
    }
};
