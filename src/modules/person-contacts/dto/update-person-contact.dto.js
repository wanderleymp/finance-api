const Joi = require('joi');

class UpdatePersonContactDTO {
    /**
     * Esquema de validação para atualização de contato
     */
    static schema = Joi.object({
        type: Joi.string()
            .valid('phone', 'email', 'whatsapp', 'telegram')
            .optional(),
        contact: Joi.alternatives().conditional('type', {
            switch: [
                { is: 'email', then: Joi.string().email().optional() },
                { is: 'phone', then: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional() },
                { is: 'whatsapp', then: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional() },
                { is: 'telegram', then: Joi.string().optional() }
            ]
        }),
        is_main: Joi.boolean().optional()
    });

    /**
     * Valida e formata dados de atualização de contato
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

module.exports = UpdatePersonContactDTO;
