const Joi = require('joi');

const createLicenseSchema = Joi.object({
    person_id: Joi.number().integer().required().messages({
        'number.base': 'O ID da pessoa deve ser um número inteiro',
        'number.integer': 'O ID da pessoa deve ser um número inteiro',
        'any.required': 'O ID da pessoa é obrigatório'
    }),
    license_name: Joi.string().trim().max(100).required().messages({
        'string.base': 'O nome da licença deve ser uma string',
        'string.max': 'O nome da licença deve ter no máximo 100 caracteres',
        'any.required': 'O nome da licença é obrigatório'
    }),
    start_date: Joi.date().iso().required().messages({
        'date.base': 'A data de início deve ser uma data válida no formato ISO',
        'any.required': 'A data de início é obrigatória'
    }),
    end_date: Joi.date().iso().min(Joi.ref('start_date')).optional().messages({
        'date.base': 'A data de término deve ser uma data válida no formato ISO',
        'date.min': 'A data de término deve ser posterior à data de início'
    }),
    status: Joi.string().valid('Ativa', 'Inativa', 'Expirada').default('Ativa').messages({
        'any.only': 'O status deve ser Ativa, Inativa ou Expirada'
    }),
    timezone: Joi.string().optional().max(50).messages({
        'string.max': 'O timezone deve ter no máximo 50 caracteres'
    })
});

const updateLicenseSchema = createLicenseSchema.fork(['person_id'], schema => schema.optional());

module.exports = {
    createLicenseSchema,
    updateLicenseSchema
};
