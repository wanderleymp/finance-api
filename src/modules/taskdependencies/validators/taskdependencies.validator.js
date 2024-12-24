const Joi = require("joi");

class TaskDependenciesValidator {
  static validateTaskDependencies(data) {
    const schema = Joi.object({
      // TODO: Definir schema de validação
    });

    return schema.validate(data);
  }
}

module.exports = TaskDependenciesValidator;
