const Joi = require('joi');

const TaskSchema = {
    create: Joi.object({
        type: Joi.string().required(),
        payload: Joi.object().required(),
        options: Joi.object({
            priority: Joi.number().min(0).max(10).default(0),
            scheduledFor: Joi.date(),
            maxRetries: Joi.number().min(1).max(10).default(3)
        }).default({})
    })
};

module.exports = TaskSchema;
