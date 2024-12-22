const Joi = require('joi');
const BaseSchema = require('../../../schemas/baseSchema');

class ContactSchema {
    static create = Joi.object({
        person_id: Joi.number().integer().positive().required(),
        type: Joi.string().valid('phone', 'email', 'whatsapp', 'telegram').required(),
        contact: Joi.string().trim().when('type', {
            is: 'phone',
            then: Joi.string().regex(/^\+?[1-9]\d{1,14}$/).required(),
            otherwise: Joi.alternatives().conditional('type', {
                is: 'email',
                then: Joi.string().email().required(),
                otherwise: Joi.string().trim().required()
            })
        }),
        description: Joi.string().trim().max(100).optional().allow(null),
        is_main: Joi.boolean().optional().default(false),
        is_active: Joi.boolean().optional().default(true)
    });

    static update = this.create.fork(['person_id', 'type', 'contact'], schema => schema.optional());

    static validateCreate(data) {
        return this.create.validate(data);
    }

    static validateUpdate(data) {
        return this.update.validate(data);
    }
}

module.exports = ContactSchema;
