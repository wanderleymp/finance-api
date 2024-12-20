/**
 * Schemas para validação de movimentos
 */
const movementSchema = {
    // Schema para listagem
    listMovements: {
        type: 'object',
        properties: {
            page: {
                type: 'string',
                pattern: '^[0-9]+$',
                description: 'Número da página'
            },
            limit: {
                type: 'string',
                pattern: '^[0-9]+$',
                description: 'Limite de itens por página'
            },
            detailed: {
                type: 'string',
                enum: ['true', 'false'],
                description: 'Se deve trazer dados detalhados com relacionamentos'
            },
            status: {
                type: 'string',
                enum: ['PENDING', 'PAID', 'CANCELED'],
                description: 'Status do movimento'
            },
            type: {
                type: 'string',
                enum: ['INCOME', 'EXPENSE'],
                description: 'Tipo do movimento'
            },
            person_id: {
                type: 'string',
                pattern: '^[0-9]+$',
                description: 'ID da pessoa'
            },
            start_date: {
                type: 'string',
                format: 'date',
                description: 'Data inicial'
            },
            end_date: {
                type: 'string',
                format: 'date',
                description: 'Data final'
            }
        },
        additionalProperties: false
    },

    // Schema para busca por ID
    getMovementById: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                pattern: '^[0-9]+$',
                description: 'ID do movimento'
            }
        },
        required: ['id'],
        additionalProperties: false
    },

    // Schema para criação
    createMovement: {
        type: 'object',
        properties: {
            description: {
                type: 'string',
                minLength: 3,
                maxLength: 255,
                description: 'Descrição do movimento'
            },
            type: {
                type: 'string',
                enum: ['INCOME', 'EXPENSE'],
                description: 'Tipo do movimento'
            },
            status: {
                type: 'string',
                enum: ['PENDING', 'PAID', 'CANCELED'],
                description: 'Status do movimento'
            },
            value: {
                type: 'number',
                minimum: 0,
                description: 'Valor do movimento'
            },
            due_date: {
                type: 'string',
                format: 'date',
                description: 'Data de vencimento'
            },
            person_id: {
                type: 'integer',
                minimum: 1,
                description: 'ID da pessoa'
            },
            installments: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        installment_number: {
                            type: 'integer',
                            minimum: 1,
                            description: 'Número da parcela'
                        },
                        value: {
                            type: 'number',
                            minimum: 0,
                            description: 'Valor da parcela'
                        },
                        due_date: {
                            type: 'string',
                            format: 'date',
                            description: 'Data de vencimento da parcela'
                        }
                    },
                    required: ['installment_number', 'value', 'due_date'],
                    additionalProperties: false
                }
            },
            payments: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        value: {
                            type: 'number',
                            minimum: 0,
                            description: 'Valor do pagamento'
                        },
                        payment_date: {
                            type: 'string',
                            format: 'date',
                            description: 'Data do pagamento'
                        },
                        payment_method: {
                            type: 'string',
                            enum: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'PIX', 'BOLETO'],
                            description: 'Método de pagamento'
                        }
                    },
                    required: ['value', 'payment_date', 'payment_method'],
                    additionalProperties: false
                }
            }
        },
        required: ['description', 'type', 'value', 'due_date', 'person_id'],
        additionalProperties: false
    },

    // Schema para atualização
    updateMovement: {
        type: 'object',
        properties: {
            description: {
                type: 'string',
                minLength: 3,
                maxLength: 255,
                description: 'Descrição do movimento'
            },
            status: {
                type: 'string',
                enum: ['PENDING', 'PAID', 'CANCELED'],
                description: 'Status do movimento'
            },
            value: {
                type: 'number',
                minimum: 0,
                description: 'Valor do movimento'
            },
            due_date: {
                type: 'string',
                format: 'date',
                description: 'Data de vencimento'
            }
        },
        additionalProperties: false
    }
};

module.exports = movementSchema;
