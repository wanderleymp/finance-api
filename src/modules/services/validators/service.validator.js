const { validate } = require('class-validator');
const { plainToClass } = require('class-transformer');
const CreateServiceDto = require('../dto/create-service.dto');
const { ValidationError } = require('../../../utils/errors');

class ServiceValidator {
    /**
     * Valida dados para criação de serviço
     * @param {Object} data - Dados do serviço
     * @throws {ValidationError} Se dados inválidos
     */
    static async validateCreateService(data) {
        const serviceDto = plainToClass(CreateServiceDto, data);
        const errors = await validate(serviceDto);

        if (errors.length > 0) {
            const errorMessages = errors.map(
                error => Object.values(error.constraints).join(', ')
            );

            throw new ValidationError(
                'Erro de validação na criação de serviço', 
                errorMessages
            );
        }

        return serviceDto;
    }
}

module.exports = ServiceValidator;
