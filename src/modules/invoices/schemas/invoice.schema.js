const Joi = require('joi');

const invoiceSchemas = {
    create: Joi.object({
        reference_id: Joi.string().max(100).required(),
        type: Joi.string().max(10).required(),
        number: Joi.string().max(50).optional(),
        series: Joi.string().max(20).optional(),
        status: Joi.string().max(20).optional(),
        environment: Joi.string().max(20).optional(),
        pdf_url: Joi.string().uri().optional(),
        xml_url: Joi.string().uri().optional(),
        movement_id: Joi.number().integer().optional(),
        integration_id: Joi.number().integer().optional().default(10),
        emitente_person_id: Joi.number().integer().optional(),
        destinatario_person_id: Joi.number().integer().optional(),
        total_amount: Joi.number().precision(2).optional()
    }),

    update: Joi.object({
        reference_id: Joi.string().max(100).optional(),
        type: Joi.string().max(10).optional(),
        number: Joi.string().max(50).optional(),
        series: Joi.string().max(20).optional(),
        status: Joi.string().max(20).optional(),
        environment: Joi.string().max(20).optional(),
        pdf_url: Joi.string().uri().optional(),
        xml_url: Joi.string().uri().optional(),
        movement_id: Joi.number().integer().optional(),
        integration_id: Joi.number().integer().optional(),
        emitente_person_id: Joi.number().integer().optional(),
        destinatario_person_id: Joi.number().integer().optional(),
        total_amount: Joi.number().precision(2).optional()
    })
};

module.exports = invoiceSchemas;
