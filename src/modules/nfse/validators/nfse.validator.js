const Joi = require('joi');

const listNFSeSchema = Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(10),
    status: Joi.string()
        .valid('PENDENTE', 'EMITIDA', 'CANCELADA', 'ERRO')
        .optional(),
    reference_id: Joi.string().optional(),
    prestador_cnpj: Joi.string().length(14).optional(),
    tomador_cnpj: Joi.string().length(14).optional()
});

const createNFSeSchema = Joi.object({
    reference_id: Joi.string().required(),
    prestador_cnpj: Joi.string().length(14).required(),
    prestador_razao_social: Joi.string().required(),
    tomador_cnpj: Joi.string().length(14).optional(),
    tomador_razao_social: Joi.string().required(),
    valor_total: Joi.number().positive().required(),
    descricao_servico: Joi.string().optional(),
    data_emissao: Joi.date().iso().optional().default(() => new Date()),
    items: Joi.array().items(Joi.object({
        descricao: Joi.string().required(),
        quantidade: Joi.number().positive().required(),
        valor_unitario: Joi.number().positive().required()
    })).optional()
});

const updateStatusSchema = Joi.object({
    status: Joi.string()
        .valid('PENDENTE', 'EMITIDA', 'CANCELADA', 'ERRO')
        .required(),
    motivo: Joi.string().when('status', {
        is: 'CANCELADA',
        then: Joi.string().required(),
        otherwise: Joi.string().optional()
    })
});

const cancelNFSeSchema = Joi.object({
    motivo: Joi.string().required()
});

module.exports = {
    listNFSeSchema,
    createNFSeSchema,
    updateStatusSchema,
    cancelNFSeSchema
};
