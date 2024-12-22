const Joi = require('joi');
const BaseSchema = require('../../../schemas/baseSchema');

class ContactSchema {
    static create = Joi.object({
        person_id: Joi.number().integer().positive().required(),
        type: Joi.string().valid('phone', 'email', 'whatsapp', 'telegram').required(),
        contact: Joi.alternatives().conditional('type', {
            switch: [
                {
                    is: 'phone',
                    then: Joi.string().regex(/^\+?[1-9]\d{1,14}$/).required()
                },
                {
                    is: 'email',
                    then: Joi.string().email().required()
                },
                {
                    is: Joi.valid('whatsapp', 'telegram'),
                    then: Joi.string().trim().required()
                }
            ]
        }),
        description: Joi.string().trim().max(100).optional().allow(null),
        is_main: Joi.boolean().optional().default(false),
        is_active: Joi.boolean().optional().default(true)
    });

    static update = Joi.object({
        type: Joi.string().valid('phone', 'email', 'whatsapp', 'telegram'),
        contact: Joi.alternatives().conditional('type', {
            switch: [
                {
                    is: 'phone',
                    then: Joi.string().regex(/^\+?[1-9]\d{1,14}$/)
                },
                {
                    is: 'email',
                    then: Joi.string().email()
                },
                {
                    is: Joi.valid('whatsapp', 'telegram'),
                    then: Joi.string().trim()
                }
            ]
        }),
        description: Joi.string().trim().max(100).allow(null),
        is_main: Joi.boolean(),
        is_active: Joi.boolean()
    }).min(1);

    static validateCreate(data) {
        return this.create.validate(data);
    }

    static validateUpdate(data) {
        return this.update.validate(data);
    }
}

module.exports = ContactSchema;
