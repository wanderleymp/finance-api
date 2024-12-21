const Joi = require('joi');

const movementPaymentSchema = {
    // Schema para listagem
    list: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        movement_id: Joi.number().integer().positive().optional(),
        payment_method_id: Joi.number().integer().positive().optional(),
        status: Joi.string().valid('Pendente', 'Pago', 'Cancelado').optional(),
        total_amount_min: Joi.number().positive().optional(),
        total_amount_max: Joi.number().positive().optional()
    }).unknown(false),

    // Schema para busca por ID
    getById: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    // Schema para criação
    create: Joi.object({
        movement_id: Joi.number().integer().positive().required(),
        payment_method_id: Joi.number().integer().positive().required(),
        total_amount: Joi.number().positive().required(),
        status: Joi.string().valid('Pendente', 'Pago', 'Cancelado').default('Pendente')
    }),

    // Schema para atualização
    update: Joi.object({
        payment_method_id: Joi.number().integer().positive().optional(),
        total_amount: Joi.number().positive().optional(),
        status: Joi.string().valid('Pendente', 'Pago', 'Cancelado').optional()
    }),

    // Schema para deleção
    delete: Joi.object({
        id: Joi.number().integer().positive().required()
    })
};

module.exports = movementPaymentSchema;
