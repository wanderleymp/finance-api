const Joi = require('joi');

class ContractAdjustmentHistoryDto {
  static createValidation() {
    return Joi.object({
      contractId: Joi.number().required(),
      previousValue: Joi.number().precision(2).required(),
      newValue: Joi.number().precision(2).required(),
      changeType: Joi.string().max(50).required(),
      changedBy: Joi.number().required()
    });
  }

  static updateValidation() {
    return Joi.object({
      previousValue: Joi.number().precision(2),
      newValue: Joi.number().precision(2),
      changeType: Joi.string().max(50),
      changedBy: Joi.number()
    }).min(1);
  }
}

module.exports = ContractAdjustmentHistoryDto;
