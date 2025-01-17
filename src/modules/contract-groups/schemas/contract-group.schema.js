const Joi = require('joi');

const ContractGroupSchema = {
    findAll: Joi.object({
        group_name: Joi.string().max(255).optional(),
        search: Joi.string().max(255).optional(),
        active: Joi.boolean().optional(),
        page: Joi.number().integer().min(1).optional().default(1),
        limit: Joi.number().integer().min(1).max(100).optional().default(10),
        orderBy: Joi.string().valid('group_name', 'created_at').optional(),
        orderDirection: Joi.string().valid('ASC', 'DESC').optional()
    }).unknown(false),

    findById: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    create: Joi.object({
        group_name: Joi.string().trim().max(255).required(),
        group_description: Joi.string().trim().optional(),
        has_decimo_terceiro: Joi.boolean().required(),
        vencimento1_dia: Joi.when('has_decimo_terceiro', {
            is: true,
            then: Joi.number().integer().min(1).max(31).optional(),
            otherwise: Joi.number().integer().min(1).max(31).optional()
        }),
        vencimento1_mes: Joi.when('has_decimo_terceiro', {
            is: true,
            then: Joi.number().integer().min(1).max(12).optional(),
            otherwise: Joi.number().integer().min(1).max(12).optional()
        }),
        vencimento2_dia: Joi.when('has_decimo_terceiro', {
            is: true,
            then: Joi.number().integer().min(1).max(31).optional(),
            otherwise: Joi.number().integer().min(1).max(31).optional()
        }),
        vencimento2_mes: Joi.when('has_decimo_terceiro', {
            is: true,
            then: Joi.number().integer().min(1).max(12).optional(),
            otherwise: Joi.number().integer().min(1).max(12).optional()
        }),
        decimo_payment_method_id: Joi.number().integer().optional().default(4),
        active: Joi.boolean().optional().default(true)
    }),

    update: Joi.object({
        group_name: Joi.string().trim().max(255).optional(),
        group_description: Joi.string().trim().optional(),
        has_decimo_terceiro: Joi.boolean().optional(),
        vencimento1_dia: Joi.when('has_decimo_terceiro', {
            is: true,
            then: Joi.number().integer().min(1).max(31).optional(),
            otherwise: Joi.number().integer().min(1).max(31).optional()
        }),
        vencimento1_mes: Joi.when('has_decimo_terceiro', {
            is: true,
            then: Joi.number().integer().min(1).max(12).optional(),
            otherwise: Joi.number().integer().min(1).max(12).optional()
        }),
        vencimento2_dia: Joi.when('has_decimo_terceiro', {
            is: true,
            then: Joi.number().integer().min(1).max(31).optional(),
            otherwise: Joi.number().integer().min(1).max(31).optional()
        }),
        vencimento2_mes: Joi.when('has_decimo_terceiro', {
            is: true,
            then: Joi.number().integer().min(1).max(12).optional(),
            otherwise: Joi.number().integer().min(1).max(12).optional()
        }),
        decimo_payment_method_id: Joi.number().integer().optional(),
        active: Joi.boolean().optional()
    }).min(1)
};

module.exports = ContractGroupSchema;
