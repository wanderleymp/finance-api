const Joi = require('joi');
const BaseSchema = require('../../../schemas/baseSchema');

class AddressSchema {
    static create = Joi.object({
        person_id: Joi.number().integer().positive().required(),
        street: Joi.string().trim().max(255).required(),
        number: Joi.string().trim().max(50).required(),
        complement: Joi.string().trim().max(100).optional().allow(null),
        neighborhood: Joi.string().trim().max(100).required(),
        city: Joi.string().trim().max(100).required(),
        state: Joi.string().trim().length(2).uppercase().required(),
        postal_code: Joi.string().trim().regex(/^\d{5}-\d{3}$/).required(),
        country: Joi.string().trim().default('Brasil').optional(),
        reference: Joi.string().trim().max(255).optional().allow(null),
        ibge: Joi.string().trim().max(20).optional().allow(null),
        is_main: Joi.boolean().optional().default(false)
    });

    static update = this.create.fork(['person_id', 'street', 'number', 'neighborhood', 'city', 'state', 'postal_code'], schema => schema.optional());

    static validateCreate(data) {
        return this.create.validate(data);
    }

    static validateUpdate(data) {
        return this.update.validate(data);
    }
}

module.exports = AddressSchema;
