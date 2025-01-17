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
        billing_reference: Joi.string().valid('current', 'previous').default('current')
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
    })
};

module.exports = contractRecurringValidator;
