const Joi = require('joi');
const { ValidationError } = require('../../../utils/errors');

const contractGroupValidator = {
    create: Joi.object({
        group_name: Joi.string().trim().max(255).required(),
        group_description: Joi.string().trim().optional(),
        has_decimo_terceiro: Joi.boolean().required(),
        vencimento1_dia: Joi.number().integer().min(1).max(31).optional(),
        vencimento1_mes: Joi.number().integer().min(1).max(12).optional(),
        vencimento2_dia: Joi.number().integer().min(1).max(31).optional(),
        vencimento2_mes: Joi.number().integer().min(1).max(12).optional(),
        decimo_payment_method_id: Joi.number().integer().optional().default(4)
    }),

    update: Joi.object({
        group_name: Joi.string().trim().max(255).optional(),
        group_description: Joi.string().trim().optional(),
        has_decimo_terceiro: Joi.boolean().optional(),
        vencimento1_dia: Joi.number().integer().min(1).max(31).optional(),
        vencimento1_mes: Joi.number().integer().min(1).max(12).optional(),
        vencimento2_dia: Joi.number().integer().min(1).max(31).optional(),
        vencimento2_mes: Joi.number().integer().min(1).max(12).optional(),
        decimo_payment_method_id: Joi.number().integer().optional()
    }),

    findAll: Joi.object({
        group_name: Joi.string().max(255).optional(),
        page: Joi.number().integer().min(1).optional().default(1),
        limit: Joi.number().integer().min(1).max(100).optional().default(10),
        orderBy: Joi.string().valid('group_name', 'created_at').optional(),
        orderDirection: Joi.string().valid('ASC', 'DESC').optional()
    }),

    findById: Joi.object({
        id: Joi.number().integer().positive().required()
    })
};

class ContractGroupValidator {
    static findAll(data) {
        const { error, value } = contractGroupValidator.findAll.validate(data, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const validationErrors = error.details.map(detail => detail.message);
            throw new ValidationError(validationErrors.join(', '));
        }

        return value;
    }

    static findById(data) {
        const { error, value } = contractGroupValidator.findById.validate(data, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const validationErrors = error.details.map(detail => detail.message);
            throw new ValidationError(validationErrors.join(', '));
        }

        return value;
    }

    static create(data) {
        const { error, value } = contractGroupValidator.create.validate(data, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const validationErrors = error.details.map(detail => detail.message);
            throw new ValidationError(validationErrors.join(', '));
        }

        return value;
    }

    static update(data) {
        const { error, value } = contractGroupValidator.update.validate(data, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const validationErrors = error.details.map(detail => detail.message);
            throw new ValidationError(validationErrors.join(', '));
        }

        return value;
    }
}

module.exports = ContractGroupValidator;
