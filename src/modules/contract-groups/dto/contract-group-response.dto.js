const Joi = require('joi');
const contractGroupValidator = require('../validators/contract-group.validator');

class ContractGroupResponseDTO {
    static validate(data) {
        const { error, value } = contractGroupValidator.findById.validate(data, { 
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
            contract_group_id: entity.contract_group_id,
            group_name: entity.group_name,
            group_description: entity.group_description,
            has_decimo_terceiro: entity.has_decimo_terceiro,
            vencimento1_dia: entity.vencimento1_dia,
            vencimento1_mes: entity.vencimento1_mes,
            vencimento2_dia: entity.vencimento2_dia,
            vencimento2_mes: entity.vencimento2_mes,
            decimo_payment_method_id: entity.decimo_payment_method_id,
            decimo_payment_method: entity.decimoPaymentMethod || null
        };
    }
}

module.exports = ContractGroupResponseDTO;
