const Joi = require("joi");

const tasktypesSchema = {
    create: Joi.object({
        name: Joi.string().max(50).required()
            .description('Nome do tipo de task'),
        description: Joi.string().allow(null)
            .description('Descrição detalhada do tipo de task'),
        max_retries: Joi.number().integer().min(0).default(3)
            .description('Número máximo de tentativas'),
        retry_delay_seconds: Joi.number().integer().min(0).default(300)
            .description('Tempo de espera entre tentativas em segundos'),
        timeout_seconds: Joi.number().integer().min(0).allow(null)
            .description('Tempo máximo de execução em segundos'),
        active: Joi.boolean().default(true)
            .description('Se o tipo de task está ativo')
    }),

    update: Joi.object({
        name: Joi.string().max(50)
            .description('Nome do tipo de task'),
        description: Joi.string().allow(null)
            .description('Descrição detalhada do tipo de task'),
        max_retries: Joi.number().integer().min(0)
            .description('Número máximo de tentativas'),
        retry_delay_seconds: Joi.number().integer().min(0)
            .description('Tempo de espera entre tentativas em segundos'),
        timeout_seconds: Joi.number().integer().min(0).allow(null)
            .description('Tempo máximo de execução em segundos'),
        active: Joi.boolean()
            .description('Se o tipo de task está ativo')
    }),

    find: Joi.object({
        name: Joi.string()
            .description('Filtrar por nome'),
        active: Joi.boolean()
            .description('Filtrar por status ativo/inativo')
    })
};

module.exports = tasktypesSchema;
