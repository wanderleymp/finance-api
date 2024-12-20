const Joi = require('joi');

/**
 * Schemas para validação de movimentos usando Joi
 */
const movementSchema = {
    // Schema para listagem
    listMovements: Joi.object({
        page: Joi.string().pattern(/^[0-9]+$/).optional(),
        limit: Joi.string().pattern(/^[0-9]+$/).optional(),
        detailed: Joi.string().valid('true', 'false').optional(),
        status: Joi.string().valid('PENDING', 'PAID', 'CANCELED').optional(),
        type: Joi.string().valid('INCOME', 'EXPENSE').optional(),
        person_id: Joi.string().pattern(/^[0-9]+$/).optional(),
        start_date: Joi.string().isoDate().optional(),
        end_date: Joi.string().isoDate().min(Joi.ref('start_date')).optional()
    }),

    // Schema para busca por ID
    getMovementById: Joi.object({
        id: Joi.string().pattern(/^[0-9]+$/).required()
    }),

    // Schema para criação
    createMovement: Joi.object({
        description: Joi.string().required().min(3).max(255),
        type: Joi.string().required().valid('INCOME', 'EXPENSE'),
        status: Joi.string().valid('PENDING', 'PAID', 'CANCELED').required(),
        value: Joi.number().required().min(0),
        due_date: Joi.string().isoDate().required(),
        person_id: Joi.number().integer().min(1).required(),
        installments: Joi.array().items(
            Joi.object({
                installment_number: Joi.number().integer().min(1).required(),
                value: Joi.number().min(0).required(),
                due_date: Joi.string().isoDate().required()
            })
        ).optional(),
        payments: Joi.array().items(
            Joi.object({
                value: Joi.number().min(0).required(),
                payment_date: Joi.string().isoDate().required(),
                payment_method: Joi.string().valid('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'PIX', 'BOLETO').required()
            })
        ).optional()
    }),

    // Schema para atualização
    updateMovement: Joi.object({
        description: Joi.string().min(3).max(255).optional(),
        status: Joi.string().valid('PENDING', 'PAID', 'CANCELED').optional(),
        value: Joi.number().min(0).optional(),
        due_date: Joi.string().isoDate().optional()
    })
};

module.exports = movementSchema;
