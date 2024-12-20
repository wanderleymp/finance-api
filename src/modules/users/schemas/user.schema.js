const Joi = require('joi');

const userSchema = {
    create: Joi.object({
        username: Joi.string()
            .required()
            .min(3)
            .max(50)
            .messages({
                'string.empty': 'Username is required',
                'string.min': 'Username must be at least 3 characters long',
                'string.max': 'Username cannot exceed 50 characters'
            }),
        password: Joi.string()
            .required()
            .min(8)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
            .messages({
                'string.empty': 'Password is required',
                'string.min': 'Password must be at least 8 characters long',
                'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
            }),
        person_id: Joi.number()
            .required()
            .messages({
                'number.base': 'Person ID must be a number',
                'any.required': 'Person ID is required'
            }),
        profile_id: Joi.number()
            .required()
            .messages({
                'number.base': 'Profile ID must be a number',
                'any.required': 'Profile ID is required'
            }),
        enable_2fa: Joi.boolean()
            .default(false),
        active: Joi.boolean()
            .default(true)
    }),

    update: Joi.object({
        username: Joi.string()
            .min(3)
            .max(50)
            .messages({
                'string.min': 'Username must be at least 3 characters long',
                'string.max': 'Username cannot exceed 50 characters'
            }),
        password: Joi.string()
            .min(8)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
            .messages({
                'string.min': 'Password must be at least 8 characters long',
                'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
            }),
        profile_id: Joi.number()
            .messages({
                'number.base': 'Profile ID must be a number'
            }),
        enable_2fa: Joi.boolean(),
        active: Joi.boolean()
    }),

    delete: Joi.object({
        id: Joi.number()
            .required()
            .messages({
                'number.base': 'ID must be a number',
                'any.required': 'ID is required'
            })
    }),

    getById: Joi.object({
        id: Joi.number()
            .required()
            .messages({
                'number.base': 'ID must be a number',
                'any.required': 'ID is required'
            })
    }),

    list: Joi.object({
        page: Joi.number()
            .min(1)
            .default(1)
            .messages({
                'number.base': 'Page must be a number',
                'number.min': 'Page must be greater than 0'
            }),
        limit: Joi.number()
            .min(1)
            .max(100)
            .default(10)
            .messages({
                'number.base': 'Limit must be a number',
                'number.min': 'Limit must be greater than 0',
                'number.max': 'Limit cannot exceed 100'
            })
    })
};

module.exports = userSchema;
