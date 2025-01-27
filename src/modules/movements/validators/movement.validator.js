const Joi = require('joi');

const listMovementsSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    detailed: Joi.boolean().default(true),
    movement_date_start: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    movement_date_end: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    movement_status_id: Joi.alternatives().try(
        Joi.number().integer(), 
        Joi.array().items(Joi.number().integer())
    ),
    movement_type_id: Joi.number().integer(),
    person_id: Joi.number().integer(),
    orderBy: Joi.string().valid(
        'movement_date',
        'movement_id',
        'movement_type_id',
        'movement_status_id',
        'total_amount'
    ).default('movement_date'),
    orderDirection: Joi.string().valid('ASC', 'DESC').default('DESC'),
    search: Joi.string().allow('').optional()
}).custom((value, helpers) => {
    if (value.movement_date_start && value.movement_date_end) {
        const start = new Date(value.movement_date_start);
        const end = new Date(value.movement_date_end);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return helpers.error('date.invalid', { 
                message: 'Data inválida. Use o formato YYYY-MM-DD' 
            });
        }
        
        if (end < start) {
            return helpers.error('date.range', { 
                message: 'A data final deve ser maior ou igual à data inicial' 
            });
        }
    }
    return value;
});

const createMovementSchema = Joi.object({
    person_id: Joi.number().integer().required().messages({
        'any.required': 'O identificador da pessoa (person_id) é obrigatório. Selecione um cliente/pessoa para a movimentação.',
        'number.base': 'O identificador da pessoa (person_id) deve ser um número inteiro válido.'
    }),
    total_amount: Joi.number().required().messages({
        'any.required': 'O valor total da movimentação (total_amount) é obrigatório. Calcule o valor total dos itens.',
        'number.base': 'O valor total da movimentação (total_amount) deve ser um número válido.'
    }),
    movement_type_id: Joi.number().integer().required().messages({
        'any.required': 'O tipo de movimentação (movement_type_id) é obrigatório. Selecione um tipo de movimento.',
        'number.base': 'O tipo de movimentação (movement_type_id) deve ser um número inteiro válido.'
    }),
    movement_status_id: Joi.alternatives().try(
        Joi.number().integer(), 
        Joi.array().items(Joi.number().integer())
    ).default(2).messages({
        'number.base': 'O status da movimentação (movement_status_id) deve ser um número inteiro válido.'
    }),
    license_id: Joi.number().integer().default(1).messages({
        'number.base': 'O identificador da licença (license_id) deve ser um número inteiro válido.'
    }),
    movement_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).default(() => new Date().toISOString().split('T')[0]).messages({
        'string.pattern.base': 'A data da movimentação deve estar no formato YYYY-MM-DD (por exemplo, 2025-01-10).'
    }),
    description: Joi.string().default((parent) => `Movimento ${parent.movement_type_id} - ${new Date().toISOString()}`),
    payment_method_id: Joi.number().integer().messages({
        'number.base': 'O método de pagamento (payment_method_id) deve ser um número inteiro válido.'
    }),
    observation: Joi.string().allow('', null),
    items: Joi.array().items(Joi.object({
        item_id: Joi.number().integer().required().messages({
            'any.required': 'Cada item deve ter um identificador (item_id).',
            'number.base': 'O identificador do item (item_id) deve ser um número inteiro válido.'
        }),
        quantity: Joi.number().positive().required().messages({
            'any.required': 'A quantidade do item é obrigatória.',
            'number.positive': 'A quantidade do item deve ser um número positivo.'
        }),
        unit_price: Joi.number().optional().messages({
            'number.base': 'O preço unitário do item deve ser um número válido.'
        })
    })).min(1).messages({
        'array.min': 'A movimentação deve conter pelo menos um item.'
    })
}).custom((value, helpers) => {
    const date = new Date(value.movement_date);
    if (isNaN(date.getTime())) {
        return helpers.error('date.invalid', { 
            message: 'Data inválida. Use o formato YYYY-MM-DD' 
        });
    }

    // Validação de total_amount baseado nos itens
    if (value.items && value.items.length > 0) {
        const calculatedTotal = value.items.reduce((total, item) => {
            const quantity = item.quantity || 0;
            const unitPrice = item.unit_price || 0;
            return total + (quantity * unitPrice);
        }, 0);

        if (calculatedTotal !== value.total_amount) {
            return helpers.error('total_amount.mismatch', {
                message: `O valor total (${value.total_amount}) não corresponde à soma dos itens (${calculatedTotal}). Verifique os preços e quantidades.`
            });
        }
    }

    return value;
});

const updateMovementSchema = Joi.object({
    movement_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    description: Joi.string(),
    total_amount: Joi.number(),
    movement_type_id: Joi.number().integer(),
    movement_status_id: Joi.alternatives().try(
        Joi.number().integer(), 
        Joi.array().items(Joi.number().integer())
    ),
    person_id: Joi.number().integer(),
    license_id: Joi.number().integer(),
    observation: Joi.string().allow('', null)
}).custom((value, helpers) => {
    if (value.movement_date) {
        const date = new Date(value.movement_date);
        if (isNaN(date.getTime())) {
            return helpers.error('date.invalid', { 
                message: 'Data inválida. Use o formato YYYY-MM-DD' 
            });
        }
    }
    return value;
}).min(1);

const updateStatusSchema = Joi.object({
    status: Joi.number().integer().required()
});

module.exports = {
    listMovementsSchema,
    createMovementSchema,
    updateMovementSchema,
    updateStatusSchema
};
