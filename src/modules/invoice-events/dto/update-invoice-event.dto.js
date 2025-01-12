const Joi = require('joi');
const { ValidationError } = require('../../../utils/errors');

class UpdateInvoiceEventDto {
    constructor(data) {
        this.validate(data);
        this.event_type = data.event_type || undefined;
        this.event_data = data.event_data || undefined;
        this.status = data.status || undefined;
        this.message = data.message || undefined;
    }

    validate(data) {
        const schema = Joi.object({
            event_type: Joi.string().max(50).optional(),
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

module.exports = UpdateInvoiceEventDto;
