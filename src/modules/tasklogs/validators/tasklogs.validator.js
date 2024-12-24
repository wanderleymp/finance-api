const Joi = require("joi");

class TaskLogsValidator {
  static validateTaskLogs(data) {
    const schema = Joi.object({
      // TODO: Definir schema de validação
    });

    return schema.validate(data);
  }
}

module.exports = TaskLogsValidator;
