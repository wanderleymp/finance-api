const Joi = require('joi');

const paymentMethodSchema = {
    // Schema para listagem
    list: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        method_name: Joi.string().optional(),
        active: Joi.boolean().optional()
    }).unknown(false),

    // Schema para busca por ID
    getById: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    // Schema para criação
    create: Joi.object({
        method_name: Joi.string().max(50).required(),
        description: Joi.string().optional(),
        has_entry: Joi.boolean().default(false),
        installment_count: Joi.number().integer().min(1).default(1),
        days_between_installments: Joi.number().integer().min(1).default(30),
        first_due_date_days: Joi.number().integer().min(1).default(30),
        account_entry_id: Joi.number().integer().positive().optional(),
        integration_mapping_id: Joi.number().integer().positive().optional(),
        payment_document_type_id: Joi.number().integer().positive().optional(),
        credential_id: Joi.number().integer().positive().optional(),
        bank_account_id: Joi.number().integer().positive().optional(),
        active: Joi.boolean().default(true)
    }),

    // Schema para atualização
    update: Joi.object({
        method_name: Joi.string().max(50).optional(),
        description: Joi.string().optional(),
        has_entry: Joi.boolean().optional(),
        installment_count: Joi.number().integer().min(1).optional(),
        days_between_installments: Joi.number().integer().min(1).optional(),
        first_due_date_days: Joi.number().integer().min(1).optional(),
        account_entry_id: Joi.number().integer().positive().optional(),
        integration_mapping_id: Joi.number().integer().positive().optional(),
        payment_document_type_id: Joi.number().integer().positive().optional(),
        credential_id: Joi.number().integer().positive().optional(),
        bank_account_id: Joi.number().integer().positive().optional(),
        active: Joi.boolean().optional()
    }),

    // Schema para deleção
    delete: Joi.object({
        id: Joi.number().integer().positive().required()
    })
};

module.exports = paymentMethodSchema;
