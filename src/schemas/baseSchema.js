const Joi = require('joi');

class BaseSchema {
    static pagination = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        search: Joi.string().trim().optional(),
        active: Joi.boolean().optional()
    });

    static id = Joi.number().integer().positive().required();

    static validatePagination(data) {
        return this.pagination.validate(data);
    }

    static validateId(data) {
        return this.id.validate(data);
    }
}

module.exports = BaseSchema;
