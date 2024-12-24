const Joi = require('joi');

const ItemSchema = {
    findAll: Joi.object({
        code: Joi.string().max(50).optional(),
        name: Joi.string().max(255).optional(),
        search: Joi.string().max(255).optional(),
        price: Joi.object({
            $gte: Joi.number().positive().optional(),
            $lte: Joi.number().positive().optional()
        }).optional(),
        active: Joi.boolean().optional(),
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        orderBy: Joi.string().valid('code', 'name', 'price', 'created_at').optional(),
        orderDirection: Joi.string().valid('ASC', 'DESC').optional()
    }).unknown(false),

    findById: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    create: Joi.object({
        code: Joi.string().max(50).required(),
        name: Joi.string().trim().max(255).required(),
        description: Joi.string().trim().optional(),
        price: Joi.number().precision(2).positive().required(),
        active: Joi.boolean().default(true)
    }),

    update: Joi.object({
        code: Joi.string().max(50).optional(),
        name: Joi.string().trim().max(255).optional(),
        description: Joi.string().trim().optional(),
        price: Joi.number().precision(2).positive().optional(),
        active: Joi.boolean().optional()
    }).min(1)
};

module.exports = ItemSchema;
