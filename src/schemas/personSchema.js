const Joi = require('joi');

const personTypes = ['PF', 'PJ', 'PR', 'OT'];

const personSchema = {
    getPersonById: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    listPersons: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        include: Joi.string().valid('documents').optional()
    }),

    createPerson: Joi.object({
        full_name: Joi.string()
            .trim()
            .min(3)
            .max(255)
            .required()
            .messages({
                'string.min': 'Nome completo deve ter no mínimo 3 caracteres',
                'string.max': 'Nome completo deve ter no máximo 255 caracteres',
                'any.required': 'Nome completo é obrigatório'
            }),
        birth_date: Joi.date()
            .iso()
            .optional()
            .messages({
                'date.format': 'Data de nascimento deve estar no formato ISO'
            }),
        person_type: Joi.string()
            .valid(...personTypes)
            .optional()
            .default('OT')
            .messages({
                'any.only': 'Tipo de pessoa inválido. Valores permitidos: PF, PJ, PR, OT'
            }),
        fantasy_name: Joi.string()
            .trim()
            .max(255)
            .optional()
            .messages({
                'string.max': 'Nome fantasia deve ter no máximo 255 caracteres'
            })
    }),

    updatePerson: Joi.object({
        full_name: Joi.string()
            .trim()
            .min(3)
            .max(255)
            .messages({
                'string.min': 'Nome completo deve ter no mínimo 3 caracteres',
                'string.max': 'Nome completo deve ter no máximo 255 caracteres'
            }),
        birth_date: Joi.date()
            .iso()
            .optional()
            .messages({
                'date.format': 'Data de nascimento deve estar no formato ISO'
            }),
        person_type: Joi.string()
            .valid(...personTypes)
            .optional()
            .messages({
                'any.only': 'Tipo de pessoa inválido. Valores permitidos: PF, PJ, PR, OT'
            }),
        fantasy_name: Joi.string()
            .trim()
            .max(255)
            .optional()
            .messages({
                'string.max': 'Nome fantasia deve ter no máximo 255 caracteres'
            })
    }).min(1)
};

module.exports = personSchema;
