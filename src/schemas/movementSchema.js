const Joi = require('joi');

module.exports = {
    listMovements: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        person_id: Joi.number().integer().positive().optional(),
        movement_type_id: Joi.number().integer().positive().optional(),
        movement_status_id: Joi.number().integer().positive().optional(),
        license_id: Joi.number().integer().positive().optional(),
        start_date: Joi.date().iso().optional(),
        end_date: Joi.date().iso().optional(),
        min_amount: Joi.number().positive().optional(),
        max_amount: Joi.number().positive().optional(),
        is_template: Joi.boolean().optional(),
        search: Joi.string().trim().optional()
    }).unknown(false),

    getMovementById: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    createMovement: Joi.object({
        movement_date: Joi.date().iso().required(),
        person_id: Joi.number().integer().positive().required(),
        total_amount: Joi.number().positive().required(),
        license_id: Joi.number().integer().positive().required(),
        discount: Joi.number().min(0).optional(),
        addition: Joi.number().min(0).optional(),
        total_items: Joi.number().min(0).optional(),
        description: Joi.string().trim().optional(),
        movement_type_id: Joi.number().integer().positive().optional(),
        movement_status_id: Joi.number().integer().positive().optional(),
        is_template: Joi.boolean().optional().default(false)
    }),

    updateMovement: Joi.object({
        movement_date: Joi.date().iso().optional(),
        person_id: Joi.number().integer().positive().optional(),
        total_amount: Joi.number().positive().optional(),
        license_id: Joi.number().integer().positive().optional(),
        discount: Joi.number().min(0).optional(),
        addition: Joi.number().min(0).optional(),
        total_items: Joi.number().min(0).optional(),
        description: Joi.string().trim().optional(),
        movement_type_id: Joi.number().integer().positive().optional(),
        movement_status_id: Joi.number().integer().positive().optional(),
        is_template: Joi.boolean().optional()
    }).min(1)
};
