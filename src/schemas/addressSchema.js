const Joi = require('joi');

const addressSchema = {
    findByCep: {
        params: Joi.object({
            cep: Joi.string()
                .pattern(/^\d{5}-?\d{3}$/)
                .required()
                .messages({
                    'string.pattern.base': 'CEP inválido. Use o formato: 12345-678 ou 12345678',
                    'any.required': 'CEP é obrigatório'
                })
        }).required()
    }
};

module.exports = addressSchema;
