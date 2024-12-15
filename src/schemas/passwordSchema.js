const Joi = require('joi');

const passwordSchema = {
    requestReset: {
        body: Joi.object({
            email: Joi.string()
                .email()
                .required()
                .messages({
                    'string.email': 'Email inválido',
                    'any.required': 'Email é obrigatório'
                })
        })
    },

    resetPassword: {
        body: Joi.object({
            token: Joi.string()
                .required()
                .messages({
                    'any.required': 'Token é obrigatório'
                }),
            newPassword: Joi.string()
                .min(8)
                .max(100)
                .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
                .required()
                .messages({
                    'string.min': 'A senha deve ter no mínimo 8 caracteres',
                    'string.max': 'A senha deve ter no máximo 100 caracteres',
                    'string.pattern.base': 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial',
                    'any.required': 'Nova senha é obrigatória'
                })
        })
    },

    changePassword: {
        body: Joi.object({
            currentPassword: Joi.string()
                .required()
                .messages({
                    'any.required': 'Senha atual é obrigatória'
                }),
            newPassword: Joi.string()
                .min(8)
                .max(100)
                .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
                .required()
                .messages({
                    'string.min': 'A senha deve ter no mínimo 8 caracteres',
                    'string.max': 'A senha deve ter no máximo 100 caracteres',
                    'string.pattern.base': 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial',
                    'any.required': 'Nova senha é obrigatória'
                })
        })
    }
};

module.exports = passwordSchema;
