const Joi = require('joi');

const listMovementsSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    detailed: Joi.boolean().default(true),
    movement_date_start: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    movement_date_end: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    movement_status_id: Joi.number().integer(),
    movement_type_id: Joi.number().integer(),
    person_id: Joi.number().integer()
}).custom((value, helpers) => {
    if (value.movement_date_start && value.movement_date_end) {
        const start = new Date(value.movement_date_start);
        const end = new Date(value.movement_date_end);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return helpers.error('date.invalid', { 
                message: 'Data inválida. Use o formato YYYY-MM-DD' 
            });
        }
        
        if (end < start) {
            return helpers.error('date.range', { 
                message: 'A data final deve ser maior ou igual à data inicial' 
            });
        }
    }
    return value;
});

const createMovementSchema = Joi.object({
    person_id: Joi.number().integer().required(),
    total_amount: Joi.number().required(),
    movement_type_id: Joi.number().integer().required(),
    movement_status_id: Joi.number().integer().default(2),
    license_id: Joi.number().integer().default(1),
    movement_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).default(() => new Date().toISOString().split('T')[0]),
    description: Joi.string().default((parent) => `Movimento ${parent.movement_type_id} - ${new Date().toISOString()}`),
    payment_method_id: Joi.number().integer(),
    observation: Joi.string().allow('', null)
}).custom((value, helpers) => {
    const date = new Date(value.movement_date);
    if (isNaN(date.getTime())) {
        return helpers.error('date.invalid', { 
            message: 'Data inválida. Use o formato YYYY-MM-DD' 
        });
    }
    return value;
});

const updateMovementSchema = Joi.object({
    movement_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    description: Joi.string(),
    total_amount: Joi.number(),
    movement_type_id: Joi.number().integer(),
    movement_status_id: Joi.number().integer(),
    person_id: Joi.number().integer(),
    license_id: Joi.number().integer(),
    observation: Joi.string().allow('', null)
}).custom((value, helpers) => {
    if (value.movement_date) {
        const date = new Date(value.movement_date);
        if (isNaN(date.getTime())) {
            return helpers.error('date.invalid', { 
                message: 'Data inválida. Use o formato YYYY-MM-DD' 
            });
        }
    }
    return value;
}).min(1);

const updateStatusSchema = Joi.object({
    status: Joi.number().integer().required()
});

module.exports = {
    listMovementsSchema,
    createMovementSchema,
    updateMovementSchema,
    updateStatusSchema
};
