const Joi = require("joi");

const tasklogsSchema = {
  create: Joi.object({
    task_id: Joi.number().integer().required()
      .description('ID da task'),
    status: Joi.string().valid('pending', 'running', 'success', 'error', 'cancelled').required()
      .description('Status da task'),
    execution_time: Joi.number().integer().min(0)
      .description('Tempo de execução em milissegundos'),
    error_message: Joi.string().allow(null)
      .description('Mensagem de erro, se houver'),
    metadata: Joi.object().allow(null)
      .description('Metadados adicionais da execução'),
    retries: Joi.number().integer().min(0)
      .description('Número de tentativas realizadas')
  }),

  update: Joi.object({
    status: Joi.string().valid('pending', 'running', 'success', 'error', 'cancelled')
      .description('Status da task'),
    execution_time: Joi.number().integer().min(0)
      .description('Tempo de execução em milissegundos'),
    error_message: Joi.string().allow(null)
      .description('Mensagem de erro, se houver'),
    metadata: Joi.object().allow(null)
      .description('Metadados adicionais da execução'),
    retries: Joi.number().integer().min(0)
      .description('Número de tentativas realizadas')
  }),

  find: Joi.object({
    task_id: Joi.number().integer()
      .description('Filtrar por ID da task'),
    status: Joi.string().valid('pending', 'running', 'success', 'error', 'cancelled')
      .description('Filtrar por status'),
    start_date: Joi.date()
      .description('Filtrar por data inicial'),
    end_date: Joi.date()
      .description('Filtrar por data final'),
    min_execution_time: Joi.number().integer().min(0)
      .description('Filtrar por tempo mínimo de execução'),
    max_execution_time: Joi.number().integer().min(0)
      .description('Filtrar por tempo máximo de execução'),
    has_error: Joi.boolean()
      .description('Filtrar por presença de erro')
  })
};

module.exports = tasklogsSchema;
