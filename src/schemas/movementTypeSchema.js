const Joi = require('joi');

const movementTypeCategories = ['RECEITA', 'DESPESA', 'INVESTIMENTO'];

module.exports = {
    listMovementTypes: Joi.object({
        name: Joi.string().optional(),
        category: Joi.string().valid(...movementTypeCategories).optional(),
        active: Joi.boolean().optional()
    }).unknown(false),

    getMovementTypeById: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    createMovementType: Joi.object({
        name: Joi.string().trim().min(3).max(100).required(),
        description: Joi.string().trim().optional(),
        category: Joi.string().valid(...movementTypeCategories).required(),
        active: Joi.boolean().optional().default(true)
    }),

    updateMovementType: Joi.object({
        name: Joi.string().trim().min(3).max(100).optional(),
        description: Joi.string().trim().optional(),
        category: Joi.string().valid(...movementTypeCategories).optional(),
        active: Joi.boolean().optional()
    }).min(1)
};
