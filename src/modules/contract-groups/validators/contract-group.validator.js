const ContractGroupSchema = require('../schemas/contract-group.schema');
const { ValidationError } = require('../../../utils/errors');

class ContractGroupValidator {
    static validateFindAll(data) {
        const { error } = ContractGroupSchema.findAll.validate(data);
        if (error) {
            throw new ValidationError(error.details[0].message);
        }
    }

    static validateFindById(data) {
        const { error } = ContractGroupSchema.findById.validate(data);
        if (error) {
            throw new ValidationError(error.details[0].message);
        }
    }

    static validateCreate(data) {
        const { error } = ContractGroupSchema.create.validate(data);
        if (error) {
            throw new ValidationError(error.details[0].message);
        }
    }

    static validateUpdate(data) {
        const { error } = ContractGroupSchema.update.validate(data);
        if (error) {
            throw new ValidationError(error.details[0].message);
        }
    }
}

module.exports = ContractGroupValidator;
