const Joi = require('joi');

const installmentSchema = {
    // Schema para listagem
    listInstallments: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        payment_id: Joi.number().integer().positive().optional(),
        status: Joi.string().valid('PENDING', 'PAID', 'OVERDUE').optional(),
        start_date: Joi.date().iso().optional(),
        end_date: Joi.date().iso().optional(),
        account_entry_id: Joi.number().integer().positive().optional(),
        include: Joi.string().valid('boletos').optional()
    }).unknown(false),

    // Schema para busca por ID
    getInstallmentById: Joi.object({
        id: Joi.number().integer().positive().required()
    })
};

module.exports = installmentSchema;
