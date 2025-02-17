const Joi = require('joi');

const chatMessageStatusSchema = Joi.object({
    status_id: Joi.number().integer().positive(),
    message_id: Joi.number().integer().positive().required(),
    status: Joi.string().valid('SENT', 'DELIVERED', 'READ').required(),
    occurred_at: Joi.date().iso()
});

const chatMessageStatusQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    messageId: Joi.number().integer().positive(),
    status: Joi.string().valid('SENT', 'DELIVERED', 'READ')
});

module.exports = {
    chatMessageStatusSchema,
    chatMessageStatusQuerySchema
};
