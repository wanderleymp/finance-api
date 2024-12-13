const Joi = require('joi');

const contactTypes = ['EMAIL', 'PHONE', 'WHATSAPP', 'TELEGRAM', 'OUTROS'];

const personContactSchema = {
    getContactById: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    createContact: Joi.object({
        person_id: Joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                'number.base': 'ID da pessoa deve ser um número',
                'number.integer': 'ID da pessoa deve ser um número inteiro',
                'any.required': 'ID da pessoa é obrigatório'
            }),
        contact_type: Joi.string()
            .valid(...contactTypes)
            .required()
            .messages({
                'any.only': 'Tipo de contato inválido. Valores permitidos: EMAIL, PHONE, WHATSAPP, TELEGRAM, OUTROS',
                'any.required': 'Tipo de contato é obrigatório'
            }),
        contact_value: Joi.string()
            .trim()
            .min(1)
            .max(255)
            .required()
            .messages({
                'string.min': 'Valor do contato não pode ser vazio',
                'string.max': 'Valor do contato deve ter no máximo 255 caracteres',
                'any.required': 'Valor do contato é obrigatório'
            }),
        description: Joi.string()
            .trim()
            .max(255)
            .optional()
            .allow('')
            .messages({
                'string.max': 'Descrição deve ter no máximo 255 caracteres'
            }),
        is_main: Joi.boolean()
            .default(false)
            .messages({
                'boolean.base': 'Campo is_main deve ser um booleano'
            }),
        active: Joi.boolean()
            .default(true)
            .messages({
                'boolean.base': 'Campo active deve ser um booleano'
            })
    }),

    updateContact: Joi.object({
        person_id: Joi.number()
            .integer()
            .positive()
            .messages({
                'number.base': 'ID da pessoa deve ser um número',
                'number.integer': 'ID da pessoa deve ser um número inteiro'
            }),
        contact_type: Joi.string()
            .valid(...contactTypes)
            .messages({
                'any.only': 'Tipo de contato inválido. Valores permitidos: EMAIL, PHONE, WHATSAPP, TELEGRAM, OUTROS'
            }),
        contact_value: Joi.string()
            .trim()
            .min(1)
            .max(255)
            .messages({
                'string.min': 'Valor do contato não pode ser vazio',
                'string.max': 'Valor do contato deve ter no máximo 255 caracteres'
            }),
        description: Joi.string()
            .trim()
            .max(255)
            .allow('')
            .messages({
                'string.max': 'Descrição deve ter no máximo 255 caracteres'
            }),
        is_main: Joi.boolean()
            .messages({
                'boolean.base': 'Campo is_main deve ser um booleano'
            }),
        active: Joi.boolean()
            .messages({
                'boolean.base': 'Campo active deve ser um booleano'
            })
    })
};

module.exports = personContactSchema;
