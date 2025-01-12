const { invoiceSchema } = require('../invoice.schema');

class UpdateInvoiceDto {
    constructor(data = {}) {
        const { error, value } = invoiceSchema.validate(data, {
            abortEarly: false,
            convert: true,
            stripUnknown: true  // Remove campos não definidos no schema
        });

        if (error) {
            throw new Error('Dados de atualização de fatura inválidos', { cause: error });
        }

        Object.assign(this, value);
    }

    toJSON() {
        const { invoice_id, ...rest } = this;
        return rest;
    }
}

module.exports = UpdateInvoiceDto;
