const Joi = require('joi');

const movementItemSchema = {
    create: Joi.object({
        movement_id: Joi.number().required(),
        item_id: Joi.number().required(),
        quantity: Joi.number().precision(2).required(),
        unit_price: Joi.number().precision(2).required(),
        total_price: Joi.number().precision(2),  // Calculado automaticamente
        salesperson_id: Joi.number().allow(null),
        technician_id: Joi.number().allow(null),
        description: Joi.string().allow(null, '')
    }),

    update: Joi.object({
        movement_id: Joi.number(),
        item_id: Joi.number(),
        quantity: Joi.number().precision(2),
        unit_price: Joi.number().precision(2),
        total_price: Joi.number().precision(2),  // Calculado automaticamente
        salesperson_id: Joi.number().allow(null),
        technician_id: Joi.number().allow(null),
        description: Joi.string().allow(null, '')
    }).min(1),

    id: Joi.object({
        id: Joi.number().required()
    })
};

module.exports = movementItemSchema;
