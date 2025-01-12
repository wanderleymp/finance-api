const { invoiceSchema } = require('../invoice.schema');

class CreateInvoiceDto {
    constructor(data = {}) {
        const { error, value } = invoiceSchema.validate(data, {
            abortEarly: false,
            convert: true
        });

        if (error) {
            throw new Error('Dados de fatura inválidos', { cause: error });
        }

        Object.assign(this, value);
    }

    // Métodos auxiliares para transformação ou validação adicional podem ser adicionados aqui
    toJSON() {
        const { invoice_id, ...rest } = this;
        return rest;
    }
}

module.exports = CreateInvoiceDto;
