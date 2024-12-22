const Joi = require('joi');

class CreatePersonContactDTO {
    /**
     * Esquema de validação para criação de contato
     */
    static schema = Joi.object({
        person_id: Joi.number().integer().positive().required(),
        type: Joi.string()
            .valid('phone', 'email', 'whatsapp', 'telegram')
            .required(),
        contact: Joi.alternatives().conditional('type', {
            switch: [
                { is: 'email', then: Joi.string().email().required() },
                { is: 'phone', then: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required() },
                { is: 'whatsapp', then: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required() },
                { is: 'telegram', then: Joi.string().required() }
            ]
        }),
        is_main: Joi.boolean().optional().default(false)
    });

    /**
     * Valida e formata dados de criação de contato
     * @param {Object} data - Dados do contato
     * @returns {Object} Dados validados e formatados
     */
    static validate(data) {
        const { error, value } = this.schema.validate(data, { 
            abortEarly: false,
            stripUnknown: true 
        });

        if (error) {
            const errorMessages = error.details.map(detail => detail.message);
            throw new Error(`Erro de validação: ${errorMessages.join(', ')}`);
        }

        return value;
    }
}

module.exports = CreatePersonContactDTO;
