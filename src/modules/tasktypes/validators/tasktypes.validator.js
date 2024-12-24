const Joi = require("joi");

class TaskTypesValidator {
  static validateTaskTypes(data) {
    const schema = Joi.object({
      // TODO: Definir schema de validação
    });

    return schema.validate(data);
  }
}

module.exports = TaskTypesValidator;
