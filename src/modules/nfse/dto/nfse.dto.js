const Joi = require('joi');

class NFSeDTO {
  static create() {
    return Joi.object({
      reference_id: Joi.string().required(),
      numero_nfse: Joi.string().optional(),
      codigo_verificacao: Joi.string().optional(),
      status: Joi.string()
        .valid('PENDENTE', 'EMITIDA', 'CANCELADA', 'ERRO')
        .default('PENDENTE'),
      ambiente: Joi.string()
        .valid('PRODUCAO', 'HOMOLOGACAO')
        .required(),
      
      prestador_cnpj: Joi.string().length(14).required(),
      prestador_razao_social: Joi.string().required(),
      
      tomador_cnpj: Joi.string().length(14).optional(),
      tomador_cpf: Joi.string().length(11).optional(),
      tomador_razao_social: Joi.string().required(),
      full_name: Joi.string().optional(),
      
      valor_total: Joi.number().precision(2).required(),
      valor_servicos: Joi.number().precision(2).required(),
      
      itens: Joi.array().items(Joi.object({
        descricao: Joi.string().required(),
        quantidade: Joi.number().precision(4).required(),
        valor_unitario: Joi.number().precision(4).required(),
        valor_total: Joi.number().precision(2).required()
      })).optional()
    });
  }

  static update() {
    return Joi.object({
      status: Joi.string()
        .valid('PENDENTE', 'EMITIDA', 'CANCELADA', 'ERRO')
        .optional(),
      numero_nfse: Joi.string().optional(),
      codigo_verificacao: Joi.string().optional()
    });
  }

  static validate(data, schema) {
    const { error, value } = schema.validate(data);
    if (error) {
      throw new Error(`Validação falhou: ${error.details[0].message}`);
    }
    return value;
  }
}

module.exports = NFSeDTO;
