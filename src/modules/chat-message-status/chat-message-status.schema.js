const Joi = require('joi');

const MESSAGE_STATUS = [
    'SENT', 
    'DELIVERED', 
    'READ', 
    'DELIVERY_ACK', 
    'PENDING', 
    'FAILED'
];

const chatMessageStatusSchema = Joi.object({
    status_id: Joi.number().integer().positive(),
    message_id: Joi.number().integer().positive().required(),
    status: Joi.string().valid(...MESSAGE_STATUS).required(),
    occurred_at: Joi.date().iso(),
    metadata: Joi.object().optional()
});

const chatMessageStatusQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    messageId: Joi.number().integer().positive(),
    status: Joi.string().valid(...MESSAGE_STATUS)
});

module.exports = {
    chatMessageStatusSchema,
    chatMessageStatusQuerySchema,
    MESSAGE_STATUS
};
