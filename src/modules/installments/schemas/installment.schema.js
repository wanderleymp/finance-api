const Joi = require('joi');

const installmentSchema = {
    // Schema para listagem
    listInstallments: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        status: Joi.string().optional(),
        payment_id: Joi.number().integer().positive().optional(),
        start_date: Joi.date().iso().optional(),
        end_date: Joi.date().iso().optional(),
        include: Joi.string().valid('boletos').optional(),
        full_name: Joi.string().optional()
    }).unknown(false),

    // Schema para busca por ID
    getInstallmentById: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    // Schema para geração de boleto
    generateBoleto: Joi.object({
        id: Joi.number().integer().positive().required()
    })
};

module.exports = installmentSchema;
