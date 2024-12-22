const AddressSchema = require('../schemas/address.schema');
const { ValidationError } = require('../../../utils/errors');

class AddressValidator {
    static validateCreate(data) {
        const { error } = AddressSchema.validateCreate(data);
        if (error) {
            throw new ValidationError(error.details[0].message);
        }
    }

    static validateUpdate(data) {
        const { error } = AddressSchema.validateUpdate(data);
        if (error) {
            throw new ValidationError(error.details[0].message);
        }
    }

    static validatePostalCode(postalCode) {
        const regex = /^\d{5}-\d{3}$/;
        if (!regex.test(postalCode)) {
            throw new ValidationError('Código postal inválido');
        }
    }

    static validateState(state) {
        const brazilianStates = [
            'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
            'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
            'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
        ];

        if (!brazilianStates.includes(state.toUpperCase())) {
            throw new ValidationError('Estado inválido');
        }
    }
}

module.exports = AddressValidator;
