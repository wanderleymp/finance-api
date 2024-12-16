const Joi = require('joi');

module.exports = {
    listMovementStatuses: Joi.object({
        status_name: Joi.string().optional()
    }).unknown(false),

    getMovementStatusById: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    createMovementStatus: Joi.object({
        status_name: Joi.string().trim().min(3).max(50).required(),
        description: Joi.string().trim().optional(),
        display_order: Joi.number().integer().optional()
    }),

    updateMovementStatus: Joi.object({
        status_name: Joi.string().trim().min(3).max(50).optional(),
        description: Joi.string().trim().optional(),
        display_order: Joi.number().integer().optional()
    }).min(1)
};
