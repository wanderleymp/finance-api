const Joi = require('joi');

const contactTypes = ['phone', 'email', 'whatsapp'];

module.exports = {
    listContacts: Joi.object({
        person_id: Joi.number().integer().positive().optional(),
        contact_type: Joi.string().valid(...contactTypes).optional(),
        active: Joi.boolean().optional()
    }).unknown(false),

    getContactById: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    createContact: Joi.object({
        person_id: Joi.number().integer().positive().required(),
        contact_type: Joi.string().valid(...contactTypes).required(),
        contact_value: Joi.string().trim().required(),
        active: Joi.boolean().optional().default(true)
    }),

    updateContact: Joi.object({
        contact_type: Joi.string().valid(...contactTypes).optional(),
        contact_value: Joi.string().trim().optional(),
        active: Joi.boolean().optional()
    }).min(1)
};
