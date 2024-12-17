const Joi = require('joi');

module.exports = {
    createMovementPayment: Joi.object({
        movement_id: Joi.number().integer().positive().required(),
        payment_method_id: Joi.number().integer().positive().required(),
        total_amount: Joi.number().positive().required(),
        status: Joi.string().optional().default('Pendente')
    }),

    updateMovementPayment: Joi.object({
        movement_id: Joi.number().integer().positive().optional(),
        payment_method_id: Joi.number().integer().positive().optional(),
        total_amount: Joi.number().positive().optional(),
        status: Joi.string().optional()
    }).min(1),

    listMovementPayments: Joi.object({
        page: Joi.number().integer().min(1).optional().default(1),
        limit: Joi.number().integer().min(1).max(100).optional().default(10),
        movement_id: Joi.number().integer().positive().optional(),
        payment_method_id: Joi.number().integer().positive().optional(),
        status: Joi.string().optional()
    }),

    getMovementPaymentById: Joi.object({
        id: Joi.number().integer().positive().required()
    })
};
