const Joi = require('joi');

const contractAdjustmentContractValidator = {
    create: Joi.object({
        adjustment_id: Joi.number().integer().required(),
        contract_id: Joi.number().integer().required(),
        status: Joi.string().valid('pending', 'applied', 'cancelled').default('pending'),
        applied_at: Joi.date()
    }),

    update: Joi.object({
        status: Joi.string().valid('pending', 'applied', 'cancelled'),
        applied_at: Joi.date()
    }),

    bulkCreate: Joi.array().items(
        Joi.object({
            adjustment_id: Joi.number().integer().required(),
            contract_id: Joi.number().integer().required(),
            status: Joi.string().valid('pending', 'applied', 'cancelled').default('pending'),
            applied_at: Joi.date()
        })
    )
};

module.exports = contractAdjustmentContractValidator;
