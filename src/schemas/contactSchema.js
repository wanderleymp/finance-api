const Joi = require('joi');

const contactTypes = ['email', 'telefone', 'whatsapp', 'fax', 'outros'];

const contactSchema = {
    // Schema para listar contatos com paginação
    listContacts: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        search: Joi.string().trim().allow('').default(''),
        contact_type: Joi.string().valid(...contactTypes).optional()
    }),

    // Schema para obter contato por ID
    getContactById: Joi.object({
        id: Joi.number().integer().required().messages({
            'number.base': 'ID deve ser um número',
            'number.integer': 'ID deve ser um número inteiro',
            'any.required': 'ID é obrigatório'
        })
    }),

    // Schema para criar novo contato
    createContact: Joi.object({
        contact_type: Joi.string()
            .valid(...contactTypes)
            .required()
            .messages({
                'any.required': 'Tipo de contato é obrigatório',
                'any.only': `Tipo de contato inválido. Valores permitidos: ${contactTypes.join(', ')}`
            }),
        contact_value: Joi.string()
            .trim()
            .required()
            .min(1)
            .max(100)
            .messages({
                'string.empty': 'Valor do contato não pode estar vazio',
                'string.min': 'Valor do contato deve ter pelo menos 1 caractere',
                'string.max': 'Valor do contato deve ter no máximo 100 caracteres',
                'any.required': 'Valor do contato é obrigatório'
            }),
        description: Joi.string()
            .trim()
            .allow('')
            .max(255)
            .messages({
                'string.max': 'Descrição deve ter no máximo 255 caracteres'
            }),
        active: Joi.boolean()
            .default(true)
            .messages({
                'boolean.base': 'Campo active deve ser um booleano'
            })
    }),

    // Schema para atualizar contato
    updateContact: Joi.object({
        contact_type: Joi.string()
            .valid(...contactTypes)
            .messages({
                'any.only': `Tipo de contato inválido. Valores permitidos: ${contactTypes.join(', ')}`
            }),
        contact_value: Joi.string()
            .trim()
            .min(1)
            .max(100)
            .messages({
                'string.empty': 'Valor do contato não pode estar vazio',
                'string.min': 'Valor do contato deve ter pelo menos 1 caractere',
                'string.max': 'Valor do contato deve ter no máximo 100 caracteres'
            }),
        description: Joi.string()
            .trim()
            .allow('')
            .max(255)
            .messages({
                'string.max': 'Descrição deve ter no máximo 255 caracteres'
            }),
        active: Joi.boolean()
            .messages({
                'boolean.base': 'Campo active deve ser um booleano'
            })
    }).min(1)
};

module.exports = contactSchema;
