const Joi = require('joi');

const contractExtraServiceSchema = {
    create: Joi.object({
        contractId: Joi.number().integer().required(),
        serviceId: Joi.number().integer().required(),
        itemDescription: Joi.string().required(),
        itemValue: Joi.number().precision(2).required(),
        serviceDate: Joi.date().required(),
        movementId: Joi.number().integer().optional().allow(null)
    }),

    update: Joi.object({
        contractId: Joi.number().integer().optional(),
        serviceId: Joi.number().integer().optional(),
        itemDescription: Joi.string().optional(),
        itemValue: Joi.number().precision(2).optional(),
        serviceDate: Joi.date().optional(),
        movementId: Joi.number().integer().optional().allow(null)
    }),

    get: Joi.object({
        extraServiceId: Joi.number().integer().optional(),
        contractId: Joi.number().integer().optional(),
        serviceId: Joi.number().integer().optional(),
        startDate: Joi.date().optional(),
        endDate: Joi.date().optional()
    })
};

module.exports = contractExtraServiceSchema;
