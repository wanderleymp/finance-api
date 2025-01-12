const Joi = require('joi');
const { ValidationError } = require('../../../utils/errors');

class UpdateNfseDto {
    constructor(data) {
        this.validate(data);
        this.integration_nfse_id = data.integration_nfse_id || undefined;
        this.service_value = data.service_value || undefined;
        this.iss_value = data.iss_value || undefined;
        this.aliquota_service = data.aliquota_service || undefined;
    }

    validate(data) {
        const schema = Joi.object({
            integration_nfse_id: Joi.string().max(100).optional().allow(null),
            service_value: Joi.number().precision(2).positive().optional(),
            iss_value: Joi.number().precision(2).positive().optional(),
            aliquota_service: Joi.number().precision(2).positive().optional()
        });

        const { error } = schema.validate(data);
        if (error) {
            throw new ValidationError(`Erro de validação: ${error.details[0].message}`);
        }
    }
}

module.exports = UpdateNfseDto;
