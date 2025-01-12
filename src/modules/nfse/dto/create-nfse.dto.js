const Joi = require('joi');
const { ValidationError } = require('../../../utils/errors');

class CreateNfseDto {
    constructor(data) {
        this.validate(data);
        this.invoice_id = data.invoice_id;
        this.integration_nfse_id = data.integration_nfse_id || null;
        this.service_value = data.service_value;
        this.iss_value = data.iss_value;
        this.aliquota_service = data.aliquota_service;
    }

    validate(data) {
        const schema = Joi.object({
            invoice_id: Joi.number().integer().positive().required(),
            integration_nfse_id: Joi.string().max(100).optional().allow(null),
            service_value: Joi.number().precision(2).positive().required(),
            iss_value: Joi.number().precision(2).positive().required(),
            aliquota_service: Joi.number().precision(2).positive().required()
        });

        const { error } = schema.validate(data);
        if (error) {
            throw new ValidationError(`Erro de validação: ${error.details[0].message}`);
        }
    }
}

module.exports = CreateNfseDto;
