const Joi = require('joi');

const personAddressSchema = {
    listPersonAddresses: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        person_id: Joi.number().integer().positive().optional(),
        city: Joi.string().optional(),
        state: Joi.string().length(2).uppercase().optional()
    }),

    getPersonAddressById: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    createPersonAddress: Joi.object({
        person_id: Joi.number().integer().positive().required(),
        street: Joi.string().max(100).required(),
        number: Joi.string().max(20).required(),
        complement: Joi.string().max(50).optional().allow(null),
        neighborhood: Joi.string().max(50).optional().allow(null),
        city: Joi.string().max(50).required(),
        state: Joi.string().length(2).uppercase().required(),
        postal_code: Joi.string().pattern(/^\d{5}-?\d{3}$/).required(),
        country: Joi.string().max(50).optional().default('Brasil'),
        reference: Joi.string().max(100).optional().allow(null),
        ibge: Joi.number().integer().optional().allow(null)
    }),

    updatePersonAddress: Joi.object({
        person_id: Joi.number().integer().positive().optional(),
        street: Joi.string().max(100).optional(),
        number: Joi.string().max(20).optional(),
        complement: Joi.string().max(50).optional().allow(null),
        neighborhood: Joi.string().max(50).optional().allow(null),
        city: Joi.string().max(50).optional(),
        state: Joi.string().length(2).uppercase().optional(),
        postal_code: Joi.string().pattern(/^\d{5}-?\d{3}$/).optional(),
        country: Joi.string().max(50).optional(),
        reference: Joi.string().max(100).optional().allow(null),
        ibge: Joi.number().integer().optional().allow(null)
    }).min(1)
};

module.exports = personAddressSchema;
