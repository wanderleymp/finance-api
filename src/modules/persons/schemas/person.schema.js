const Joi = require('joi');

const personTypes = ['PF', 'PJ'];

const createPersonSchema = Joi.object({
    full_name: Joi.string()
        .trim()
        .min(2)
        .max(255)
        .required()
        .messages({
            'string.min': 'O nome deve ter no mínimo 2 caracteres',
            'string.max': 'O nome deve ter no máximo 255 caracteres',
            'any.required': 'O nome é obrigatório'
        }),

    fantasy_name: Joi.string()
        .trim()
        .max(255)
        .optional()
        .messages({
            'string.max': 'O nome fantasia deve ter no máximo 255 caracteres'
        }),

    birth_date: Joi.date()
        .iso()
        .max('now')
        .optional()
        .messages({
            'date.format': 'Data de nascimento inválida',
            'date.max': 'Data de nascimento não pode ser futura'
        }),

    person_type: Joi.string()
        .valid(...personTypes)
        .default('PJ')
        .messages({
            'any.only': `Tipo de pessoa deve ser um dos seguintes: ${personTypes.join(', ')}`
        }),

    active: Joi.boolean()
        .default(true)
});

const updatePersonSchema = Joi.object({
    full_name: Joi.string()
        .trim()
        .min(2)
        .max(255)
        .optional()
        .messages({
            'string.min': 'O nome deve ter no mínimo 2 caracteres',
            'string.max': 'O nome deve ter no máximo 255 caracteres'
        }),

    fantasy_name: Joi.string()
        .trim()
        .max(255)
        .optional()
        .messages({
            'string.max': 'O nome fantasia deve ter no máximo 255 caracteres'
        }),

    birth_date: Joi.date()
        .iso()
        .max('now')
        .optional()
        .messages({
            'date.format': 'Data de nascimento inválida',
            'date.max': 'Data de nascimento não pode ser futura'
        }),

    person_type: Joi.string()
        .valid(...personTypes)
        .optional()
        .messages({
            'any.only': `Tipo de pessoa deve ser um dos seguintes: ${personTypes.join(', ')}`
        }),

    active: Joi.boolean()
        .optional()
});

module.exports = {
    createPersonSchema,
    updatePersonSchema
};
