const Joi = require('joi');

const licenseSchema = {
    createLicense: {
        body: Joi.object({
            person_id: Joi.number().integer().required().messages({
                'number.base': 'O ID da pessoa deve ser um número',
                'any.required': 'O ID da pessoa é obrigatório'
            }),
            license_name: Joi.string().max(100).required().messages({
                'string.base': 'O nome da licença deve ser uma string',
                'string.max': 'O nome da licença deve ter no máximo 100 caracteres',
                'any.required': 'O nome da licença é obrigatório'
            }),
            start_date: Joi.date().required().messages({
                'date.base': 'A data de início deve ser uma data válida',
                'any.required': 'A data de início é obrigatória'
            }),
            end_date: Joi.date().allow(null).greater(Joi.ref('start_date')).messages({
                'date.base': 'A data de término deve ser uma data válida',
                'date.greater': 'A data de término deve ser posterior à data de início'
            }),
            status: Joi.string().valid('Ativa', 'Inativa', 'Suspensa', 'Cancelada').default('Ativa').messages({
                'string.base': 'O status deve ser uma string',
                'any.only': 'Status inválido'
            }),
            timezone: Joi.string().max(50).allow(null).messages({
                'string.base': 'O fuso horário deve ser uma string',
                'string.max': 'O fuso horário deve ter no máximo 50 caracteres'
            }),
            active: Joi.boolean().default(true).messages({
                'boolean.base': 'O campo active deve ser um booleano'
            })
        })
    },
    updateLicense: {
        params: Joi.object({
            id: Joi.number().integer().required().messages({
                'number.base': 'O ID deve ser um número',
                'any.required': 'O ID é obrigatório'
            })
        }),
        body: Joi.object({
            license_name: Joi.string().max(100).messages({
                'string.base': 'O nome da licença deve ser uma string',
                'string.max': 'O nome da licença deve ter no máximo 100 caracteres'
            }),
            start_date: Joi.date().messages({
                'date.base': 'A data de início deve ser uma data válida'
            }),
            end_date: Joi.date().allow(null).greater(Joi.ref('start_date')).messages({
                'date.base': 'A data de término deve ser uma data válida',
                'date.greater': 'A data de término deve ser posterior à data de início'
            }),
            status: Joi.string().valid('Ativa', 'Inativa', 'Suspensa', 'Cancelada').messages({
                'string.base': 'O status deve ser uma string',
                'any.only': 'Status inválido'
            }),
            timezone: Joi.string().max(50).allow(null).messages({
                'string.base': 'O fuso horário deve ser uma string',
                'string.max': 'O fuso horário deve ter no máximo 50 caracteres'
            }),
            active: Joi.boolean().messages({
                'boolean.base': 'O campo active deve ser um booleano'
            })
        })
    },
    getLicenseById: {
        params: Joi.object({
            id: Joi.number().integer().required().messages({
                'number.base': 'O ID deve ser um número',
                'any.required': 'O ID é obrigatório'
            })
        })
    },
    listLicenses: {
        query: Joi.object({
            page: Joi.number().integer().min(1).default(1).messages({
                'number.base': 'A página deve ser um número',
                'number.min': 'A página deve ser maior que 0'
            }),
            limit: Joi.number().integer().min(1).max(100).default(10).messages({
                'number.base': 'O limite deve ser um número',
                'number.min': 'O limite deve ser maior que 0',
                'number.max': 'O limite deve ser menor que 100'
            }),
            search: Joi.string().allow('').messages({
                'string.base': 'O termo de busca deve ser uma string'
            })
        })
    }
};

module.exports = licenseSchema;
