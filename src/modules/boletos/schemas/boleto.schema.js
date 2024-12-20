const Joi = require('joi');

const boletoSchema = {
    // Schema para listagem
    listBoletos: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        status: Joi.string().valid('A Emitir', 'Emitido', 'Cancelado', 'Pago').optional(),
        installment_id: Joi.number().integer().positive().optional(),
        movement_id: Joi.number().integer().positive().optional(),
        start_date: Joi.date().iso().optional(),
        end_date: Joi.date().iso().optional(),
        payer_id: Joi.number().integer().positive().optional()
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
        due_date: Joi.date().iso().optional(),
        amount: Joi.number().positive().optional(),
        status: Joi.string().valid('A Emitir', 'Emitido', 'Cancelado').optional()
    }).unknown(false),

    // Schema para cancelamento
    cancelBoleto: Joi.object({
        reason: Joi.string().max(255).required()
    }).unknown(false)
};

module.exports = boletoSchema;
