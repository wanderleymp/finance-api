const Joi = require('joi');

const createPersonDocumentSchema = Joi.object({
    person_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'any.required': 'O ID da pessoa é obrigatório',
            'number.base': 'O ID da pessoa deve ser um número',
            'number.integer': 'O ID da pessoa deve ser um número inteiro',
            'number.positive': 'O ID da pessoa deve ser um número positivo'
        }),

    document_type: Joi.string()
        .valid('CPF', 'CNPJ', 'RG', 'IE')
        .required()
        .messages({
            'any.required': 'O tipo do documento é obrigatório',
            'string.base': 'O tipo do documento deve ser uma string',
            'any.only': 'Tipo de documento inválido. Use: CPF, CNPJ, RG ou IE'
        }),

    document_value: Joi.string()
        .required()
        .min(3)
        .max(50)
        .messages({
            'any.required': 'O valor do documento é obrigatório',
            'string.base': 'O valor do documento deve ser uma string',
            'string.min': 'O valor do documento deve ter no mínimo {#limit} caracteres',
            'string.max': 'O valor do documento deve ter no máximo {#limit} caracteres'
        })
});

const updatePersonDocumentSchema = Joi.object({
    document_type: Joi.string()
        .valid('CPF', 'CNPJ', 'RG', 'IE')
        .messages({
            'string.base': 'O tipo do documento deve ser uma string',
            'any.only': 'Tipo de documento inválido. Use: CPF, CNPJ, RG ou IE'
        }),

    document_value: Joi.string()
        .min(3)
        .max(50)
        .messages({
            'string.base': 'O valor do documento deve ser uma string',
            'string.min': 'O valor do documento deve ter no mínimo {#limit} caracteres',
            'string.max': 'O valor do documento deve ter no máximo {#limit} caracteres'
        })
}).min(1).messages({
    'object.min': 'Pelo menos um campo deve ser fornecido para atualização'
});

module.exports = {
    createPersonDocumentSchema,
    updatePersonDocumentSchema
};
