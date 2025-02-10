const ContractExtraServiceValidator = require('../validators/contract-extra-service.validator');

class ContractExtraServiceCreateDTO {
    static validate(data) {
        // Mapear amount para quantity se existir
        const processedData = { ...data };
        if (processedData.amount !== undefined) {
            processedData.quantity = processedData.amount;
            delete processedData.amount;
        }

        const { error, value } = ContractExtraServiceValidator.create.validate(processedData, { 
            abortEarly: false,
            stripUnknown: true 
        });

        if (error) {
            const validationErrors = error.details.map(detail => detail.message);
            throw new Error(`Validation Error: ${validationErrors.join(', ')}`);
        }

        return value;
    }

    static fromEntity(entity) {
        return {
            extraServiceId: entity.extra_service_id,
            contractId: entity.contract_id,
            serviceId: entity.service_id,
            itemDescription: entity.item_description,
            itemValue: entity.item_value,
            serviceDate: entity.service_date,
            movementId: entity.movement_id
        };
    }
}

module.exports = ContractExtraServiceCreateDTO;
