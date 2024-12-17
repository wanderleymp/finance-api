const Joi = require('joi');

module.exports = {
    listItems: Joi.object({
        name: Joi.string().optional(),
        category: Joi.string().optional(),
        min_price: Joi.number().positive().optional(),
        max_price: Joi.number().positive().optional(),
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional()
    }).unknown(false),

    getItemById: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    createItem: Joi.object({
        name: Joi.string().trim().min(3).max(100).required(),
        description: Joi.string().trim().max(255).optional(),
        category: Joi.string().trim().max(50).optional(),
        price: Joi.number().positive().required(),
        stock_quantity: Joi.number().integer().min(0).optional().default(0),
        unit: Joi.string().trim().max(20).optional(),
        is_active: Joi.boolean().optional().default(true)
    }),

    updateItem: Joi.object({
        name: Joi.string().trim().min(3).max(100).optional(),
        description: Joi.string().trim().max(255).optional(),
        category: Joi.string().trim().max(50).optional(),
        price: Joi.number().positive().optional(),
        stock_quantity: Joi.number().integer().min(0).optional(),
        unit: Joi.string().trim().max(20).optional(),
        is_active: Joi.boolean().optional()
    }).min(1)
};
