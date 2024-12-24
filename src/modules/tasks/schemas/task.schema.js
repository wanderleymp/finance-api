const Joi = require('joi');

const TaskSchema = {
    create: Joi.object({
        name: Joi.string().required()
            .description('Nome da task'),
        type_id: Joi.number().integer().required()
            .description('ID do tipo da task'),
        description: Joi.string().allow(null)
            .description('Descrição da task'),
        payload: Joi.object().required()
            .description('Dados necessários para execução da task'),
        status: Joi.string().valid('pending', 'running', 'success', 'error', 'cancelled').default('pending')
            .description('Status atual da task'),
        priority: Joi.number().integer().min(0).max(10).default(0)
            .description('Prioridade de execução (0-10)'),
        scheduled_for: Joi.date()
            .description('Data/hora agendada para execução'),
        max_retries: Joi.number().integer().min(0).max(10).default(3)
            .description('Número máximo de tentativas'),
        dependencies: Joi.array().items(Joi.number().integer())
            .description('IDs das tasks que precisam ser concluídas antes desta')
    }),

    update: Joi.object({
        name: Joi.string()
            .description('Nome da task'),
        type_id: Joi.number().integer()
            .description('ID do tipo da task'),
        description: Joi.string().allow(null)
            .description('Descrição da task'),
        payload: Joi.object()
            .description('Dados necessários para execução da task'),
        status: Joi.string().valid('pending', 'running', 'success', 'error', 'cancelled')
            .description('Status atual da task'),
        priority: Joi.number().integer().min(0).max(10)
            .description('Prioridade de execução (0-10)'),
        scheduled_for: Joi.date()
            .description('Data/hora agendada para execução'),
        max_retries: Joi.number().integer().min(0).max(10)
            .description('Número máximo de tentativas')
    }),

    find: Joi.object({
        name: Joi.string()
            .description('Filtrar por nome'),
        type_id: Joi.number().integer()
            .description('Filtrar por tipo'),
        status: Joi.string().valid('pending', 'running', 'success', 'error', 'cancelled')
            .description('Filtrar por status'),
        priority: Joi.number().integer().min(0).max(10)
            .description('Filtrar por prioridade'),
        start_date: Joi.date()
            .description('Filtrar por data inicial de agendamento'),
        end_date: Joi.date()
            .description('Filtrar por data final de agendamento'),
        has_dependencies: Joi.boolean()
            .description('Filtrar tasks com ou sem dependências')
    })
};

module.exports = TaskSchema;
