const Joi = require('joi');
const { validateCPF, validateCNPJ } = require('../../../utils/documentValidator');

const personTypes = ['individual', 'legal'];

const createPersonSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(150)
        .required()
        .messages({
            'string.min': 'O nome deve ter no mínimo 2 caracteres',
            'string.max': 'O nome deve ter no máximo 150 caracteres',
            'any.required': 'O nome é obrigatório'
        }),

    document: Joi.string()
        .trim()
        .custom((value, helpers) => {
            // Remove caracteres não numéricos
            const cleanDocument = value.replace(/[^\d]/g, '');

            // Valida CPF ou CNPJ
            if (cleanDocument.length === 11) {
                if (!validateCPF(cleanDocument)) {
                    return helpers.error('document.invalidCPF');
                }
            } else if (cleanDocument.length === 14) {
                if (!validateCNPJ(cleanDocument)) {
                    return helpers.error('document.invalidCNPJ');
                }
            } else {
                return helpers.error('document.invalidLength');
            }

            return cleanDocument;
        })
        .required()
        .messages({
            'any.required': 'O documento é obrigatório',
            'document.invalidCPF': 'CPF inválido',
            'document.invalidCNPJ': 'CNPJ inválido',
            'document.invalidLength': 'Documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos)'
        }),

    email: Joi.string()
        .trim()
        .email({ tlds: { allow: false } })
        .max(100)
        .optional()
        .messages({
            'string.email': 'E-mail inválido',
            'string.max': 'O e-mail deve ter no máximo 100 caracteres'
        }),

    birth_date: Joi.date()
        .iso()
        .max('now')
        .optional()
        .messages({
            'date.format': 'Data de nascimento inválida',
            'date.max': 'Data de nascimento não pode ser futura'
        }),

    type: Joi.string()
        .valid(...personTypes)
        .required()
        .messages({
            'any.only': `Tipo de pessoa deve ser um dos seguintes: ${personTypes.join(', ')}`,
            'any.required': 'O tipo de pessoa é obrigatório'
        }),

    is_active: Joi.boolean()
        .optional()
        .default(true)
});

const updatePersonSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(150)
        .optional()
        .messages({
            'string.min': 'O nome deve ter no mínimo 2 caracteres',
            'string.max': 'O nome deve ter no máximo 150 caracteres'
        }),

    document: Joi.string()
        .trim()
        .custom((value, helpers) => {
            // Remove caracteres não numéricos
            const cleanDocument = value.replace(/[^\d]/g, '');

            // Valida CPF ou CNPJ
            if (cleanDocument.length === 11) {
                if (!validateCPF(cleanDocument)) {
                    return helpers.error('document.invalidCPF');
                }
            } else if (cleanDocument.length === 14) {
                if (!validateCNPJ(cleanDocument)) {
                    return helpers.error('document.invalidCNPJ');
                }
            } else {
                return helpers.error('document.invalidLength');
            }

            return cleanDocument;
        })
        .optional()
        .messages({
            'document.invalidCPF': 'CPF inválido',
            'document.invalidCNPJ': 'CNPJ inválido',
            'document.invalidLength': 'Documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos)'
        }),

    email: Joi.string()
        .trim()
        .email({ tlds: { allow: false } })
        .max(100)
        .optional()
        .messages({
            'string.email': 'E-mail inválido',
            'string.max': 'O e-mail deve ter no máximo 100 caracteres'
        }),

    birth_date: Joi.date()
        .iso()
        .max('now')
        .optional()
        .messages({
            'date.format': 'Data de nascimento inválida',
            'date.max': 'Data de nascimento não pode ser futura'
        }),

    type: Joi.string()
        .valid(...personTypes)
        .optional()
        .messages({
            'any.only': `Tipo de pessoa deve ser um dos seguintes: ${personTypes.join(', ')}`
        }),

    is_active: Joi.boolean()
        .optional()
});

module.exports = {
    createPersonSchema,
    updatePersonSchema,
    personTypes
};
