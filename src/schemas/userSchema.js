const Joi = require('joi');

module.exports = {
    // Esquema para registro de usuário
    create: Joi.object({
        person_id: Joi.number().integer().required(),
        profile_id: Joi.number().integer().required(),
        username: Joi.string().required(),
        password: Joi.string().required(),
        active: Joi.boolean().default(true),
        enable_2fa: Joi.boolean().default(false)
    }),

    // Esquema para login de usuário
    login: Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required(),
        twoFactorToken: Joi.string().when('enable_2fa', {
            is: true,
            then: Joi.required(),
            otherwise: Joi.optional()
        })
    }),

    // Esquema para verificação 2FA
    verify2FA: Joi.object({
        token: Joi.string().required()
    }),

    // Esquema para listagem de usuários
    list: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        search: Joi.string().optional(),
        active: Joi.boolean().optional()
    }),

    // Esquema para busca por ID
    getById: Joi.object({
        id: Joi.number().integer().required()
    }),

    // Esquema para busca por pessoa
    getByPerson: Joi.object({
        personId: Joi.number().integer().required()
    }),

    // Esquema para atualização de usuário
    update: Joi.object({
        id: Joi.number().integer().required(),
        profile_id: Joi.number().integer().optional(),
        username: Joi.string().optional(),
        password: Joi.string().optional(),
        active: Joi.boolean().optional(),
        enable_2fa: Joi.boolean().optional()
    }).min(1),

    // Esquema para atualização de senha
    updatePassword: Joi.object({
        newPassword: Joi.string().required().min(8).max(50)
    }),

    // Esquema para deleção de usuário
    delete: Joi.object({
        id: Joi.number().integer().required()
    })
};
