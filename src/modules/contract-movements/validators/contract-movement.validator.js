const Joi = require('joi');
const { ValidationError } = require('../../../utils/errors');

const contractMovementValidator = {
    findAll(data) {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).optional().default(1),
            limit: Joi.number().integer().min(1).max(100).optional().default(10),
            orderBy: Joi.string().valid('contract_id', 'movement_id').optional(),
            orderDirection: Joi.string().valid('ASC', 'DESC').optional().default('ASC')
        });

        const { error, value } = schema.validate(data);
        
        if (error) {
            throw new ValidationError(error.details[0].message);
        }

        return value;
    },

    findById(data) {
        const schema = Joi.object({
            contract_id: Joi.number().integer().required(),
            movement_id: Joi.number().integer().required()
        });

        const { error, value } = schema.validate(data);
        
        if (error) {
            throw new ValidationError(error.details[0].message);
        }

        return value;
    },

    create(data) {
        const schema = Joi.object({
            contract_id: Joi.number().integer().required(),
            movement_id: Joi.number().integer().required()
        });

        const { error, value } = schema.validate(data);
        
        if (error) {
            throw new ValidationError(error.details[0].message);
        }

        return value;
    },

    update(data) {
        const schema = Joi.object({
            contract_id: Joi.number().integer().required(),
            movement_id: Joi.number().integer().required()
        });

        const { error, value } = schema.validate(data);
        
        if (error) {
            throw new ValidationError(error.details[0].message);
        }

        return value;
    }
};

module.exports = contractMovementValidator;
