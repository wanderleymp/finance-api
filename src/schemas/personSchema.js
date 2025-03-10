const Joi = require('joi');
const { cleanDocument, isValidCNPJ } = require('../utils/documentUtils');

const personTypes = ['PF', 'PJ', 'PR', 'OT'];

const personSchema = {
    getPersonById: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    listPersons: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        include: Joi.string().valid('documents').optional(),
        search: Joi.string().trim().optional()
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

    createPersonByCnpj: Joi.object({
        cnpj: Joi.string()
            .trim()
            .custom((value, helpers) => {
                const cleanedCnpj = cleanDocument(value);
                
                if (!isValidCNPJ(cleanedCnpj)) {
                    return helpers.error('any.invalid');
                }
                
                return cleanedCnpj;
            })
            .required()
            .messages({
                'any.invalid': 'CNPJ inválido',
                'any.required': 'CNPJ é obrigatório'
            }),
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
            .default('PJ')
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
    }).min(1),

    findByCnpj: Joi.object({
        cnpj: Joi.string()
            .trim()
            .custom((value, helpers) => {
                const cleanedCnpj = cleanDocument(value);
                
                if (!isValidCNPJ(cleanedCnpj)) {
                    return helpers.error('any.invalid');
                }
                
                return cleanedCnpj;
            })
            .required()
            .messages({
                'any.invalid': 'CNPJ inválido',
                'any.required': 'CNPJ é obrigatório'
            })
    })
};

module.exports = personSchema;
