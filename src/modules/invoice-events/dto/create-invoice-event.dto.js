const Joi = require('joi');
const { ValidationError } = require('../../../utils/errors');

class CreateInvoiceEventDto {
    constructor(data) {
        this.validate(data);
        this.invoice_id = data.invoice_id;
        this.event_type = data.event_type;
        this.event_data = data.event_data || null;
        this.status = data.status || null;
        this.message = data.message || null;
    }

    validate(data) {
        const schema = Joi.object({
            invoice_id: Joi.number().integer().positive().required(),
            event_type: Joi.string().max(50).required(),
            event_data: Joi.object().optional().allow(null),
            status: Joi.string().max(20).optional().allow(null),
            message: Joi.string().optional().allow(null)
        });

        const { error } = schema.validate(data);
        if (error) {
            throw new ValidationError(`Erro de validação: ${error.details[0].message}`);
        }
    }
}

module.exports = CreateInvoiceEventDto;
