const Joi = require('joi');

const ContractGroupSchema = {
    findAll: Joi.object({
        name: Joi.string().max(255).optional(),
        search: Joi.string().max(255).optional(),
        active: Joi.boolean().optional(),
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        orderBy: Joi.string().valid('name', 'created_at').optional(),
        orderDirection: Joi.string().valid('ASC', 'DESC').optional()
    }).unknown(false),

    findById: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    create: Joi.object({
        name: Joi.string().trim().max(255).required(),
        description: Joi.string().trim().optional(),
        has_decimo_terceiro: Joi.boolean().required(),
        vencimento_primeiro: Joi.when('has_decimo_terceiro', {
            is: true,
            then: Joi.number().integer().min(1).max(31).required(),
            otherwise: Joi.number().integer().min(1).max(31).optional()
        }),
        vencimento_segundo: Joi.when('has_decimo_terceiro', {
            is: true,
            then: Joi.number().integer().min(1).max(31).required(),
            otherwise: Joi.number().integer().min(1).max(31).optional()
        }),
        active: Joi.boolean().default(true)
    }),

    update: Joi.object({
        name: Joi.string().trim().max(255).optional(),
        description: Joi.string().trim().optional(),
        has_decimo_terceiro: Joi.boolean().optional(),
        vencimento_primeiro: Joi.when('has_decimo_terceiro', {
            is: true,
            then: Joi.number().integer().min(1).max(31).optional(),
            otherwise: Joi.number().integer().min(1).max(31).optional()
        }),
        vencimento_segundo: Joi.when('has_decimo_terceiro', {
            is: true,
            then: Joi.number().integer().min(1).max(31).optional(),
            otherwise: Joi.number().integer().min(1).max(31).optional()
        }),
        active: Joi.boolean().optional()
    }).min(1)
};

module.exports = ContractGroupSchema;
