const Joi = require('joi');

const boletoSchema = {
    // Schema para listagem
    listBoletos: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        status: Joi.string().valid('A_RECEBER', 'PAGO', 'CANCELADO', 'EMITIDO').optional(),
        installment_id: Joi.number().integer().positive().optional(),
        boleto_number: Joi.string().optional(),
        start_date: Joi.date().iso().optional(),
        end_date: Joi.date().iso().optional()
    }).unknown(false),

    // Schema para busca por ID
    getBoletoById: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    // Schema para criação
    createBoleto: Joi.object({
        installment_id: Joi.number().integer().positive().required(),
        due_date: Joi.date().iso().required(),
        amount: Joi.number().positive().required(),
        payer_id: Joi.number().integer().positive().required(),
        description: Joi.string().max(255).optional()
    }).unknown(false),

    // Schema para atualização
    updateBoleto: Joi.object({
        status: Joi.string().valid('A_RECEBER', 'PAGO', 'CANCELADO', 'EMITIDO').required()
    }).unknown(false),

    // Schema para cancelamento
    cancelBoleto: Joi.object({
        reason: Joi.string().max(255).required()
    }).unknown(false)
};

module.exports = boletoSchema;
