const Joi = require('joi');
const contractRecurringValidator = require('../validators/contract-recurring.validator');

class ContractRecurringCreateDTO {
    static validate(data) {
        const { error, value } = contractRecurringValidator.create.validate(data, { 
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
            contract_name: entity.contract_name,
            contract_value: entity.contract_value,
            start_date: entity.start_date,
            end_date: entity.end_date,
            recurrence_period: entity.recurrence_period,
            due_day: entity.due_day,
            days_before_due: entity.days_before_due,
            status: entity.status,
            model_movement_id: entity.model_movement_id,
            contract_group_id: entity.contract_group_id,
            billing_reference: entity.billing_reference
        };
    }
}

module.exports = ContractRecurringCreateDTO;
