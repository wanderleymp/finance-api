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
    id: Joi.string().required(),
    created_at: Joi.date().iso().required(),
    status: Joi.string().required(),
    ambiente: Joi.string().valid('producao', 'homologacao').required(),
    referencia: Joi.string().required(),
    DPS: Joi.object().optional(),
    mensagens: Joi.array().optional()
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

const processarPdfNfseSchema = Joi.object({
    integrationNfseId: Joi.string()
        .required()
        .trim()
        .min(1)
        .max(50)
        .description('ID de integração da NFSe'),
    
    invoiceId: Joi.string()
        .required()
        .trim()
        .min(1)
        .max(50)
        .description('ID da invoice relacionada'),
    
    options: Joi.object({
        ambiente: Joi.string()
            .valid('homologacao', 'producao')
            .default('homologacao')
            .description('Ambiente de emissão da NFSe'),
        
        rodape: Joi.string()
            .optional()
            .max(200)
            .description('Rodapé opcional para o PDF')
    })
    .optional()
    .description('Opções adicionais para processamento do PDF')
});

module.exports = {
    listNFSeSchema,
    createNFSeSchema,
    updateStatusSchema,
    cancelNFSeSchema,
    processarPdfNfseSchema
};
