const Joi = require('joi');

const documentTypes = ['CPF', 'CNPJ', 'RG', 'IE', 'OTHER'];

const personDocumentSchema = {
    getDocumentById: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    createDocument: Joi.object({
        person_id: Joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                'number.base': 'ID da pessoa deve ser um número',
                'number.integer': 'ID da pessoa deve ser um número inteiro',
                'number.positive': 'ID da pessoa deve ser positivo',
                'any.required': 'ID da pessoa é obrigatório'
            }),
        document_value: Joi.string()
            .trim()
            .min(1)
            .max(50)
            .required()
            .messages({
                'string.empty': 'Valor do documento não pode estar vazio',
                'string.max': 'Valor do documento deve ter no máximo 50 caracteres',
                'any.required': 'Valor do documento é obrigatório'
            }),
        document_type: Joi.string()
            .valid(...documentTypes)
            .required()
            .messages({
                'any.only': `Tipo de documento inválido. Valores permitidos: ${documentTypes.join(', ')}`,
                'any.required': 'Tipo de documento é obrigatório'
            })
    }),

    updateDocument: Joi.object({
        document_value: Joi.string()
            .trim()
            .min(1)
            .max(50)
            .messages({
                'string.empty': 'Valor do documento não pode estar vazio',
                'string.max': 'Valor do documento deve ter no máximo 50 caracteres'
            }),
        document_type: Joi.string()
            .valid(...documentTypes)
            .messages({
                'any.only': `Tipo de documento inválido. Valores permitidos: ${documentTypes.join(', ')}`
            })
    }).min(1)
};

module.exports = personDocumentSchema;
