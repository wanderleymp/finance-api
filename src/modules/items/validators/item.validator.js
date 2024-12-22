const ItemSchema = require('../schemas/item.schema');
const { ValidationError } = require('../../../utils/errors');

class ItemValidator {
    static validateFindAll(data) {
        const { error } = ItemSchema.findAll.validate(data);
        if (error) {
            throw new ValidationError(error.details[0].message);
        }
    }

    static validateFindById(data) {
        const { error } = ItemSchema.findById.validate(data);
        if (error) {
            throw new ValidationError(error.details[0].message);
        }
    }

    static validateCreate(data) {
        const { error } = ItemSchema.create.validate(data);
        if (error) {
            throw new ValidationError(error.details[0].message);
        }
    }

    static validateUpdate(data) {
        const { error } = ItemSchema.update.validate(data);
        if (error) {
            throw new ValidationError(error.details[0].message);
        }
    }
}

module.exports = ItemValidator;
