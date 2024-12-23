const movementItemSchema = require('../schemas/movement-item.schema');
const { ValidationError } = require('../../../utils/errors');

class MovementItemValidator {
    static async validateCreate(data) {
        try {
            return await movementItemSchema.create.validateAsync(data, { abortEarly: false });
        } catch (error) {
            throw new ValidationError('Erro de validação', error.details);
        }
    }

    static async validateUpdate(data) {
        try {
            return await movementItemSchema.update.validateAsync(data, { abortEarly: false });
        } catch (error) {
            throw new ValidationError('Erro de validação', error.details);
        }
    }

    static async validateId(data) {
        try {
            return await movementItemSchema.id.validateAsync(data, { abortEarly: false });
        } catch (error) {
            throw new ValidationError('Erro de validação', error.details);
        }
    }
}

module.exports = MovementItemValidator;
