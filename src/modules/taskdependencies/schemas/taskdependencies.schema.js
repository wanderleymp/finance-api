const Joi = require("joi");

const taskdependenciesSchema = {
  create: Joi.object({
    task_id: Joi.number().integer().required()
      .description('ID da task'),
    depends_on_task_id: Joi.number().integer().required()
      .description('ID da task dependente'),
    condition: Joi.string().valid('success', 'failure', 'any').default('success')
      .description('Condição para considerar a dependência satisfeita'),
    active: Joi.boolean().default(true)
      .description('Se a dependência está ativa')
  }),

  update: Joi.object({
    condition: Joi.string().valid('success', 'failure', 'any')
      .description('Condição para considerar a dependência satisfeita'),
    active: Joi.boolean()
      .description('Se a dependência está ativa')
  }),

  find: Joi.object({
    task_id: Joi.number().integer()
      .description('Filtrar por ID da task'),
    depends_on_task_id: Joi.number().integer()
      .description('Filtrar por ID da task dependente'),
    condition: Joi.string().valid('success', 'failure', 'any')
      .description('Filtrar por condição'),
    active: Joi.boolean()
      .description('Filtrar por status ativo/inativo')
  })
};

module.exports = taskdependenciesSchema;
