const Joi = require('joi');

const authSchema = {
    login: Joi.object({
        username: Joi.string()
            .required()
            .messages({
                'string.empty': 'Username is required',
                'any.required': 'Username is required'
            }),
        password: Joi.string()
            .required()
            .messages({
                'string.empty': 'Password is required',
                'any.required': 'Password is required'
            }),
        twoFactorToken: Joi.string()
            .optional()
            .messages({
                'string.base': 'Two factor token must be a string'
            })
    }),

    refresh: Joi.object({
        refreshToken: Joi.string()
            .required()
            .messages({
                'string.empty': 'Refresh token is required',
                'any.required': 'Refresh token is required'
            })
    }),

    logout: Joi.object({
        refreshToken: Joi.string()
            .required()
            .messages({
                'string.empty': 'Refresh token is required',
                'any.required': 'Refresh token is required'
            })
    })
};

module.exports = authSchema;
