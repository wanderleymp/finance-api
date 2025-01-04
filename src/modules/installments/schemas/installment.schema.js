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
    }),

    // Schema para atualização de vencimento
    updateDueDate: Joi.object({
        id: Joi.number().integer().positive().required(),
        due_date: Joi.string().isoDate().optional(),
        amount: Joi.number().positive().optional()
    }).min(1).unknown(false),

    // Schema para atualização de vencimento e valor
    updateInstallment: Joi.object({
        id: Joi.number().integer().positive().required(),
        due_date: Joi.alternatives().try(
            Joi.date().iso(), 
            Joi.string().isoDate()
        ).optional(),
        amount: Joi.alternatives().try(
            Joi.number().positive(), 
            Joi.string().regex(/^\d+(\.\d{1,2})?$/)
        ).optional()
    }).or('due_date', 'amount').unknown(false),
};

module.exports = installmentSchema;
