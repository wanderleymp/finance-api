const Joi = require('joi');

const createMovementItemSchema = Joi.object({
    item_id: Joi.number().integer().required(),
    quantity: Joi.number().required(),
    unit_price: Joi.number().required(),
    description: Joi.string().optional()
});

module.exports = {
    createMovementItemSchema
};
