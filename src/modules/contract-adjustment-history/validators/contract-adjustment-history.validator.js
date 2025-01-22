const Joi = require('joi');

const contractAdjustmentHistoryValidator = {
  create: Joi.object({
    contractId: Joi.number().integer().required().messages({
      'number.base': 'O ID do contrato deve ser um número inteiro',
      'number.integer': 'O ID do contrato deve ser um número inteiro',
      'any.required': 'O ID do contrato é obrigatório'
    }),
    previousValue: Joi.number().precision(2).required().messages({
      'number.base': 'O valor anterior deve ser um número',
      'number.precision': 'O valor anterior deve ter no máximo 2 casas decimais',
      'any.required': 'O valor anterior é obrigatório'
    }),
    newValue: Joi.number().precision(2).required().messages({
      'number.base': 'O novo valor deve ser um número',
      'number.precision': 'O novo valor deve ter no máximo 2 casas decimais',
      'any.required': 'O novo valor é obrigatório'
    }),
    changeType: Joi.string().max(50).required().messages({
      'string.base': 'O tipo de alteração deve ser uma string',
      'string.max': 'O tipo de alteração deve ter no máximo 50 caracteres',
      'any.required': 'O tipo de alteração é obrigatório'
    }),
    changedBy: Joi.number().integer().required().messages({
      'number.base': 'O ID do usuário que realizou a alteração deve ser um número inteiro',
      'number.integer': 'O ID do usuário que realizou a alteração deve ser um número inteiro',
      'any.required': 'O ID do usuário que realizou a alteração é obrigatório'
    })
  }),

  update: Joi.object({
    previousValue: Joi.number().precision(2).messages({
      'number.base': 'O valor anterior deve ser um número',
      'number.precision': 'O valor anterior deve ter no máximo 2 casas decimais'
    }),
    newValue: Joi.number().precision(2).messages({
      'number.base': 'O novo valor deve ser um número',
      'number.precision': 'O novo valor deve ter no máximo 2 casas decimais'
    }),
    changeType: Joi.string().max(50).messages({
      'string.base': 'O tipo de alteração deve ser uma string',
      'string.max': 'O tipo de alteração deve ter no máximo 50 caracteres'
    }),
    changedBy: Joi.number().integer().messages({
      'number.base': 'O ID do usuário que realizou a alteração deve ser um número inteiro',
      'number.integer': 'O ID do usuário que realizou a alteração deve ser um número inteiro'
    })
  }).min(1)
};

module.exports = contractAdjustmentHistoryValidator;
