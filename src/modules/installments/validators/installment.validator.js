const { ValidationError } = require('../../../utils/errors');
const installmentSchema = require('../schemas/installment.schema');

const installmentValidator = {
    validateListInstallments: (data) => {
        const { error } = installmentSchema.listInstallments.validate(data);
        if (error) throw new ValidationError(error.message);
    },

    validateGetInstallmentById: (data) => {
        const { error } = installmentSchema.getInstallmentById.validate(data);
        if (error) throw new ValidationError(error.message);
    },

    validateCreateInstallment: (data) => {
        const { error } = installmentSchema.createInstallment.validate(data);
        if (error) throw new ValidationError(error.message);
    },

    validateUpdateInstallment: (data) => {
        const { error } = installmentSchema.updateInstallment.validate(data);
        if (error) throw new ValidationError(error.message);
    }
};

module.exports = installmentValidator;
