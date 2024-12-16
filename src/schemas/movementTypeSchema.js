const Joi = require('joi');

module.exports = {
    listMovementTypes: Joi.object({
        type_name: Joi.string().optional()
    }).unknown(false),

    getMovementTypeById: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    createMovementType: Joi.object({
        type_name: Joi.string().trim().min(3).max(50).required()
    }),

    updateMovementType: Joi.object({
        type_name: Joi.string().trim().min(3).max(50).optional()
    }).min(1)
};
