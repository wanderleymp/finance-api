const Joi = require('joi');

const createPersonLicense = Joi.object({
    person_id: Joi.number().integer().required().messages({
        'number.base': 'ID da pessoa deve ser um número inteiro',
        'number.integer': 'ID da pessoa deve ser um número inteiro',
        'any.required': 'ID da pessoa é obrigatório'
    }),
    license_id: Joi.number().integer().required().messages({
        'number.base': 'ID da licença deve ser um número inteiro',
        'number.integer': 'ID da licença deve ser um número inteiro',
        'any.required': 'ID da licença é obrigatório'
    })
});

const getPersonLicenses = Joi.object({
    personId: Joi.number().integer().required().messages({
        'number.base': 'ID da pessoa deve ser um número inteiro',
        'number.integer': 'ID da pessoa deve ser um número inteiro',
        'any.required': 'ID da pessoa é obrigatório'
    })
});

const getLicensePersons = Joi.object({
    licenseId: Joi.number().integer().required().messages({
        'number.base': 'ID da licença deve ser um número inteiro',
        'number.integer': 'ID da licença deve ser um número inteiro',
        'any.required': 'ID da licença é obrigatório'
    })
});

const removePersonLicense = Joi.object({
    personId: Joi.number().integer().required().messages({
        'number.base': 'ID da pessoa deve ser um número inteiro',
        'number.integer': 'ID da pessoa deve ser um número inteiro',
        'any.required': 'ID da pessoa é obrigatório'
    }),
    licenseId: Joi.number().integer().required().messages({
        'number.base': 'ID da licença deve ser um número inteiro',
        'number.integer': 'ID da licença deve ser um número inteiro',
        'any.required': 'ID da licença é obrigatório'
    })
});

const listOptions = Joi.object({
    page: Joi.number().integer().min(1).optional().messages({
        'number.base': 'Página deve ser um número inteiro',
        'number.integer': 'Página deve ser um número inteiro',
        'number.min': 'Página deve ser maior que zero'
    }),
    limit: Joi.number().integer().min(1).max(100).optional().messages({
        'number.base': 'Limite deve ser um número inteiro',
        'number.integer': 'Limite deve ser um número inteiro',
        'number.min': 'Limite deve ser maior que zero',
        'number.max': 'Limite não pode ser maior que 100'
    })
});

module.exports = {
    createPersonLicense,
    getPersonLicenses,
    getLicensePersons,
    removePersonLicense,
    listOptions
};
