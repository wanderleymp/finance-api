const Joi = require('joi');

const invoiceSchema = Joi.object({
    invoice_id: Joi.number().integer().optional(),
    reference_id: Joi.string().max(100).required(),
    type: Joi.string().max(10).required(),
    number: Joi.string().max(50).optional().allow(null),
    series: Joi.string().max(20).optional().allow(null),
    status: Joi.string().max(20).optional().allow(null),
    environment: Joi.string().max(20).optional().allow(null),
    pdf_url: Joi.string().uri().optional().allow(null),
    xml_url: Joi.string().uri().optional().allow(null),
    created_at: Joi.date().optional().default(() => new Date()),
    updated_at: Joi.date().optional().default(() => new Date()),
    movement_id: Joi.number().integer().optional().allow(null),
    integration_id: Joi.number().integer().optional().default(10),
    emitente_person_id: Joi.number().integer().optional().allow(null),
    destinatario_person_id: Joi.number().integer().optional().allow(null),
    total_amount: Joi.number().precision(2).optional().allow(null)
});

const validateInvoice = (invoice) => {
    return invoiceSchema.validate(invoice, { 
        abortEarly: false,  // retorna todos os erros de uma vez
        convert: true       // converte tipos quando possível
    });
};

module.exports = {
    invoiceSchema,
    validateInvoice
};
