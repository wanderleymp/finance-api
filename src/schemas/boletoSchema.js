const Joi = require('joi');

module.exports = {
    listBoletos: Joi.object({
        installment_id: Joi.number().integer().optional(),
        status: Joi.string().optional(),
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional()
    }).unknown(false),

    getBoletoById: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    createBoleto: Joi.object({
        installment_id: Joi.number().integer().required(),
        boleto_number: Joi.string().trim().max(50).required(),
        boleto_url: Joi.string().uri().optional(),
        status: Joi.string().trim().max(20).optional().default('Pendente'),
        codigo_barras: Joi.string().trim().max(100).required(),
        linha_digitavel: Joi.string().trim().max(100).required(),
        pix_copia_e_cola: Joi.string().optional(),
        external_boleto_id: Joi.string().trim().max(50).optional()
    }),

    updateBoleto: Joi.object({
        installment_id: Joi.number().integer().optional(),
        boleto_number: Joi.string().trim().max(50).optional(),
        boleto_url: Joi.string().uri().optional(),
        status: Joi.string().trim().max(20).optional(),
        codigo_barras: Joi.string().trim().max(100).optional(),
        linha_digitavel: Joi.string().trim().max(100).optional(),
        pix_copia_e_cola: Joi.string().optional(),
        external_boleto_id: Joi.string().trim().max(50).optional()
    }).min(1)
};
