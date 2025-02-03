const Joi = require('joi');

const contractRecurringValidator = {
    create: Joi.object({
        contract_name: Joi.string().trim().max(255).optional(),
        contract_value: Joi.number().positive().required(),
        start_date: Joi.date().iso().required(),
        end_date: Joi.date().iso().min(Joi.ref('start_date')).optional(),
        recurrence_period: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly').required(),
        due_day: Joi.number().integer().min(1).max(31).required(),
        days_before_due: Joi.number().integer().min(0).optional(),
        status: Joi.string().valid('active', 'inactive', 'paused').default('active'),
        model_movement_id: Joi.number().integer().optional(),
        contract_group_id: Joi.number().integer().optional(),
        billing_reference: Joi.string().valid('current', 'previous', 'next current').default('current'),
        person_id: Joi.number().integer().required(),
        movement_type_id: Joi.number().integer().optional(),
        license_id: Joi.number().integer().required(),
        items: Joi.array().items(Joi.object({
            item_id: Joi.number().integer().required(),
            quantity: Joi.number().precision(2).required(),
            unit_price: Joi.number().precision(2).required(),
            total_price: Joi.number().precision(2).optional(),
            description: Joi.string().allow(null, '').optional()
        })).min(1).required()
    }),

    update: Joi.object({
        contract_name: Joi.string().trim().max(255).optional(),
        contract_value: Joi.number().positive().optional(),
        start_date: Joi.date().iso().optional(),
        end_date: Joi.date().iso().min(Joi.ref('start_date')).optional(),
        recurrence_period: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly').optional(),
        due_day: Joi.number().integer().min(1).max(31).optional(),
        days_before_due: Joi.number().integer().min(0).optional(),
        status: Joi.string().valid('active', 'inactive', 'paused').optional(),
        model_movement_id: Joi.number().integer().optional(),
        contract_group_id: Joi.number().integer().optional(),
        billing_reference: Joi.string().valid('current', 'previous').optional()
    }),

    // Nova validação para ajuste de contrato
    adjustment: Joi.object({
        adjustmentMode: Joi.string().valid('increase', 'decrease').required(),
        adjustmentType: Joi.string().valid('percentage', 'fixed').required(),
        adjustmentValue: Joi.number().positive().required(),
        description: Joi.string().optional()
    })
};

module.exports = contractRecurringValidator;
