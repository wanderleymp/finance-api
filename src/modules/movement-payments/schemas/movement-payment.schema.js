const Joi = require('joi');

const movementPaymentSchema = {
    // Schema para listagem
    listPayments: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        movement_id: Joi.number().integer().positive().optional(),
        payment_method_id: Joi.number().integer().positive().optional(),
        status: Joi.string().optional()
    }).unknown(false),

    // Schema para busca por ID
    getPaymentById: Joi.object({
        id: Joi.number().integer().positive().required()
    })
};

module.exports = movementPaymentSchema;
